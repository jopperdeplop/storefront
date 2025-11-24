import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import Image from "next/image";
import { AddButton } from "./AddButton";
import { VariantSelector } from "@/ui/components/VariantSelector";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import { CheckoutAddLineDocument, ProductDetailsDocument, ProductListDocument } from "@/gql/graphql";
import * as Checkout from "@/lib/checkout";

// Interface to fix "Unsafe member access" lint errors on images
interface ProductImage {
	url: string;
	alt?: string | null;
}

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	const productName = product.seoTitle || product.name;
	const variantName = product.variants?.find(({ id }) => id === searchParams.variant)?.name;
	const productNameAndVariant = variantName ? `${productName} - ${variantName}` : productName;

	return {
		title: `${product.name} | ${product.seoTitle || (await parent).title?.absolute}`,
		description: product.seoDescription || productNameAndVariant,
		alternates: {
			canonical: process.env.NEXT_PUBLIC_STOREFRONT_URL
				? process.env.NEXT_PUBLIC_STOREFRONT_URL + `/products/${encodeURIComponent(params.slug)}`
				: undefined,
		},
		openGraph: product.thumbnail
			? {
					images: [
						{
							url: product.thumbnail.url,
							alt: product.name,
						},
					],
				}
			: null,
	};
}

export async function generateStaticParams({ params }: { params: { channel: string } }) {
	const { products } = await executeGraphQL(ProductListDocument, {
		revalidate: 60,
		variables: { first: 20, channel: params.channel },
		withAuth: false,
	});

	const paths = products?.edges.map(({ node: { slug } }) => ({ slug })) || [];
	return paths;
}

const parser = edjsHTML();

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string }>;
	searchParams: Promise<{ variant?: string }>;
}) {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	// Safe parsing for description with suppression for external parser types
	// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
	const description = product?.description ? parser.parse(JSON.parse(product?.description)) : null;
	const variants = product.variants;
	const selectedVariantID = searchParams.variant;
	const selectedVariant = variants?.find(({ id }) => id === selectedVariantID);

	async function addItem() {
		"use server";

		const checkout = await Checkout.findOrCreate({
			checkoutId: await Checkout.getIdFromCookies(params.channel),
			channel: params.channel,
		});
		invariant(checkout, "This should never happen");

		await Checkout.saveIdToCookie(params.channel, checkout.id);

		if (!selectedVariantID) {
			return;
		}

		await executeGraphQL(CheckoutAddLineDocument, {
			variables: {
				id: checkout.id,
				productVariantId: decodeURIComponent(selectedVariantID),
			},
			cache: "no-cache",
		});

		revalidatePath("/cart");
	}

	const isAvailable = variants?.some((variant) => variant.quantityAvailable) ?? false;

	const price = selectedVariant?.pricing?.price?.gross
		? formatMoney(selectedVariant.pricing.price.gross.amount, selectedVariant.pricing.price.gross.currency)
		: isAvailable
			? formatMoneyRange({
					start: product?.pricing?.priceRange?.start?.gross,
					stop: product?.pricing?.priceRange?.stop?.gross,
				})
			: "";

	const productJsonLd: WithContext<Product> = {
		"@context": "https://schema.org",
		"@type": "Product",
		image: product.thumbnail?.url,
		...(selectedVariant
			? {
					name: `${product.name} - ${selectedVariant.name}`,
					description: product.seoDescription || `${product.name} - ${selectedVariant.name}`,
					offers: {
						"@type": "Offer",
						availability: selectedVariant.quantityAvailable
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: selectedVariant.pricing?.price?.gross.currency,
						price: selectedVariant.pricing?.price?.gross.amount,
					},
				}
			: {
					name: product.name,
					description: product.seoDescription || product.name,
					offers: {
						"@type": "AggregateOffer",
						availability: product.variants?.some((variant) => variant.quantityAvailable)
							? "https://schema.org/InStock"
							: "https://schema.org/OutOfStock",
						priceCurrency: product.pricing?.priceRange?.start?.gross.currency,
						lowPrice: product.pricing?.priceRange?.start?.gross.amount,
						highPrice: product.pricing?.priceRange?.start?.gross.amount,
					},
				}),
	};

	// --- FIX: Handle Media Safety ---
	// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
	const productWithMedia = product as any;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
	const rawMedia = productWithMedia.media;
	// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
	const hasMedia = Array.isArray(rawMedia) && rawMedia.length > 0;

	const images: ProductImage[] = hasMedia
		? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
			(rawMedia as ProductImage[])
		: product.thumbnail
			? ([product.thumbnail] as ProductImage[])
			: [];

	return (
		<section className="min-h-screen bg-stone-50 pb-24 text-gray-900 selection:bg-terracotta selection:text-white md:pb-0">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(productJsonLd),
				}}
			/>

			<form action={addItem} className="h-full">
				{/* --- PLAN SECTION 6.1: Context-Aware Layout (Split Screen) --- */}
				<div className="mx-auto max-w-[1920px] md:grid md:min-h-screen md:grid-cols-12 md:gap-0">
					{/* --- LEFT: The Visual & Story (60%) --- */}
					<div className="border-r border-gray-200 bg-white md:col-span-7 lg:col-span-8">
						{/* Carousel / Image Stack */}
						<div className="flex flex-col">
							{images.map((img, idx) => (
								<div
									key={idx}
									// UPDATED: Fixed height relative to viewport (85vh) to ensure it fits above the fold.
									// On mobile, we keep a generous square/rect height.
									className="relative flex h-[50vh] w-full items-center justify-center border-b border-gray-100 last:border-0 md:h-[85vh]"
								>
									<Image
										src={img.url}
										alt={img.alt || product.name}
										fill
										// UPDATED: 'object-contain' ensures the WHOLE product is seen without cropping
										// Added padding (p-8) so it breathes and doesn't touch the edges.
										className="object-contain p-8"
										sizes="(max-width: 768px) 100vw, 60vw"
										priority={idx === 0}
									/>
								</div>
							))}
						</div>

						{/* --- PLAN SECTION 6.1: The "Deep Dive" (Below Fold) --- */}
						<div className="max-w-4xl px-6 py-16 md:px-20 md:py-24">
							<span className="mb-4 block font-mono text-xs uppercase tracking-widest text-terracotta">
								The Origin Story
							</span>
							<h2 className="mb-8 font-serif text-3xl text-gray-900 md:text-4xl">Material Standard.</h2>

							{description && (
								<div className="prose prose-lg prose-neutral max-w-none prose-headings:font-serif prose-a:text-terracotta">
									{description.map((content) => (
										<div key={content} dangerouslySetInnerHTML={{ __html: xss(content) }} />
									))}
								</div>
							)}

							{/* Static "Material Standard" reinforcement if no description exists */}
							{!description && (
								<p className="text-lg leading-relaxed text-gray-600">
									This product adheres to the Euro-Standard certification for authentic craftsmanship. Created
									in verified European workshops using locally sourced materials.
								</p>
							)}
						</div>
					</div>

					{/* --- RIGHT: Purchase & Context Rail (40% - Sticky) --- */}
					<div className="relative bg-stone-50 md:col-span-5 lg:col-span-4">
						<div className="flex flex-col justify-between px-6 py-8 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:px-12 md:py-16">
							{/* Top Element: Brand Context */}
							<div className="mb-8">
								<div className="mb-6 flex items-center gap-3">
									<div className="h-8 w-8 rounded-full bg-gray-200"></div> {/* Logo Placeholder */}
									<span className="font-mono text-xs uppercase tracking-wide text-gray-500">
										Established 2025 • Europe
									</span>
								</div>

								<h1 className="mb-2 font-serif text-4xl font-medium leading-tight text-gray-900 md:text-5xl">
									{product.name}
								</h1>
								<p className="font-mono text-sm text-gray-500">
									{product.category?.name || "Utility Object"}
								</p>
							</div>

							{/* Middle: Price & Selectors */}
							<div className="mb-auto">
								<div className="mb-8 flex items-baseline gap-4 border-b border-gray-200 pb-8">
									<span className="text-2xl font-medium text-gray-900">{price}</span>
									{/* Custom Availability Indicator */}
									{isAvailable && (
										<span className="flex items-center gap-2 font-mono text-xs text-emerald-600">
											<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
											In Stock
										</span>
									)}
								</div>
								{variants && (
									<div className="mb-8">
										<VariantSelector
											selectedVariant={selectedVariant}
											variants={variants}
											product={product}
											channel={params.channel}
										/>
									</div>
								)}
								[cite_start]{/* Trust Badge: Cleaned to remove artifacts [cite: 104-106] */}
								<div className="mb-8 rounded border border-gray-200 bg-white p-4">
									<ul className="space-y-2 text-xs">
										<li className="flex items-center gap-2">
											<span className="text-terracotta">✓</span> Official Brand Partner
										</li>
										<li className="flex items-center gap-2">
											<span className="text-terracotta">✓</span> Direct Shipping from Workshop
										</li>
									</ul>
								</div>
								{/* Desktop Add Button - Styled for Terracotta */}
								<div className="hidden md:block [&>button]:h-14 [&>button]:w-full [&>button]:bg-terracotta [&>button]:font-bold [&>button]:uppercase [&>button]:tracking-widest [&>button]:text-white [&>button]:transition-all [&>button]:hover:bg-terracotta-dark">
									<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
								</div>
								<div className="mt-4 hidden text-center md:block">
									<span className="font-mono text-[10px] uppercase text-gray-400">
										Secure Transaction • 14-Day Returns
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* --- MOBILE FLOATING DOCK --- */}
				<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
					<div className="flex items-center gap-4">
						<div className="flex flex-shrink-0 flex-col">
							<span className="font-mono text-[10px] uppercase text-gray-500">Total</span>
							<span className="font-bold text-gray-900">{price}</span>
						</div>
						<div className="flex-grow">
							<div className="[&>button]:h-12 [&>button]:w-full [&>button]:rounded-none [&>button]:bg-terracotta [&>button]:font-bold [&>button]:uppercase [&>button]:tracking-wide [&>button]:text-white">
								<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
							</div>
						</div>
					</div>
				</div>
			</form>
		</section>
	);
}
