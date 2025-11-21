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
import { AvailabilityMessage } from "@/ui/components/AvailabilityMessage";

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
	const description = product?.description
		? (parser.parse(JSON.parse(product?.description)) )
		: null;
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

	// --- FIX START: Handle Media Safety ---
	// We use explicit type casting and disable specific lint rules for this block
	// to handle the potentially missing 'media' type in the generated GraphQL schema.

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
	// --- FIX END ---

	return (
		<section className="min-h-screen bg-vapor pb-24 text-carbon md:pb-0">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(productJsonLd),
				}}
			/>

			<form action={addItem} className="h-full">
				{/* --- SPLIT SCREEN LAYOUT --- */}
				<div className="md:flex md:items-start">
					{/* --- LEFT COLUMN: Images --- */}
					<div className="w-full border-r border-gray-200 bg-white md:w-1/2">
						<div className="flex flex-col">
							{images.map((img, idx) => (
								<div
									key={idx}
									className="relative aspect-square w-full border-b border-gray-100 md:aspect-[4/5]"
								>
									<Image
										src={img.url}
										alt={img.alt || product.name}
										fill
										className="object-cover"
										sizes="(max-width: 768px) 100vw, 50vw"
										priority={idx === 0}
									/>
								</div>
							))}
						</div>

						{/* Mobile Only: Description appears under images on phones */}
						<div className="px-6 py-8 md:hidden">
							<h2 className="mb-4 font-mono text-xs uppercase text-gray-400">Specs & Details</h2>
							{description && (
								<div className="prose prose-sm prose-neutral max-w-none">
									{description.map((content) => (
										<div key={content} dangerouslySetInnerHTML={{ __html: xss(content) }} />
									))}
								</div>
							)}
						</div>
					</div>

					{/* --- RIGHT COLUMN: Sidebar --- */}
					<div className="flex w-full flex-col bg-vapor px-6 py-8 md:sticky md:top-0 md:w-1/2 md:px-12 md:py-12">
						<div className="flex items-start justify-between border-b border-gray-300 pb-6">
							<h1 className="max-w-md text-2xl font-bold uppercase leading-none tracking-tight md:text-4xl">
								{product.name}
							</h1>
							<span
								className="rounded bg-cobalt/5 px-2 py-1 font-mono text-lg text-cobalt"
								data-testid="ProductElement_Price"
							>
								{price}
							</span>
						</div>

						{variants && (
							<div className="pt-6">
								<VariantSelector
									selectedVariant={selectedVariant}
									variants={variants}
									product={product}
									channel={params.channel}
								/>
							</div>
						)}

						<div className="pt-4">
							<AvailabilityMessage isAvailable={isAvailable} />
						</div>

						{/* Desktop Description */}
						<div className="hidden pb-8 pt-6 md:block">
							<h3 className="mb-4 font-mono text-xs uppercase text-gray-400">System Specs</h3>
							{description && (
								<div className="prose prose-neutral max-w-md prose-p:text-sm prose-p:leading-relaxed">
									{description.map((content) => (
										<div key={content} dangerouslySetInnerHTML={{ __html: xss(content) }} />
									))}
								</div>
							)}
						</div>

						{/* Add Button */}
						<div className="hidden w-full md:block">
							<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
						</div>
					</div>
				</div>

				{/* --- MOBILE FLOATING DOCK --- */}
				<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] md:hidden">
					<div className="flex items-center gap-4">
						<div className="flex flex-shrink-0 flex-col">
							<span className="font-mono text-[10px] uppercase text-gray-500">Total</span>
							<span className="font-bold text-carbon">{price}</span>
						</div>
						<div className="flex-grow">
							<div className="[&>button]:h-12 [&>button]:w-full [&>button]:rounded-none [&>button]:bg-cobalt [&>button]:font-bold [&>button]:uppercase [&>button]:tracking-wide [&>button]:text-white">
								<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
							</div>
						</div>
					</div>
				</div>
			</form>
		</section>
	);
}
