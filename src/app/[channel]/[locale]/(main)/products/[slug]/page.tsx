import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import Image from "next/image";
import Link from "next/link";
import { AddButton } from "./AddButton";
import { VariantSelector } from "@/ui/components/VariantSelector";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import {
	CheckoutAddLineDocument,
	ProductDetailsDocument,
	ProductListByCategoryDocument,
	type LanguageCodeEnum,
} from "@/gql/graphql";
import * as Checkout from "@/lib/checkout";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

// --- FIX: Safe Type Extensions ---
interface WithTranslation {
	translation?: {
		name?: string;
		description?: string;
		seoDescription?: string;
	} | null;
}

interface ProductImage {
	url: string;
	alt?: string | null;
}

interface WithMedia {
	media?: ProductImage[] | null;
}

interface WithAttributes {
	attributes?: Array<{
		attribute: { slug: string };
		values: Array<{
			name: string;
			reference?: string | null; // UPDATED: Scalar ID
		}>;
	}> | null;
}
// --------------------------------

export async function generateMetadata(
	props: {
		params: Promise<{ slug: string; channel: string; locale: string }>;
		searchParams: Promise<{ variant?: string }>;
	},
	parent: ResolvingMetadata,
): Promise<Metadata> {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
			locale: params.locale.toUpperCase() as LanguageCodeEnum,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	const productWithTranslation = product as typeof product & WithTranslation;
	const productName = productWithTranslation.translation?.name || product.seoTitle || product.name;
	const variantName = product.variants?.find(({ id }) => id === searchParams.variant)?.name;
	const productNameAndVariant = variantName ? `${productName} - ${variantName}` : productName;
	const seoDescription =
		productWithTranslation.translation?.seoDescription || product.seoDescription || productNameAndVariant;

	return {
		title: `${productName} | ${product.seoTitle || (await parent).title?.absolute}`,
		description: seoDescription,
		alternates: {
			canonical: process.env.NEXT_PUBLIC_STOREFRONT_URL
				? process.env.NEXT_PUBLIC_STOREFRONT_URL +
					`/${params.channel}/${params.locale}/products/${encodeURIComponent(params.slug)}`
				: undefined,
		},
		openGraph: product.thumbnail
			? {
					images: [
						{
							url: product.thumbnail.url,
							alt: productName,
						},
					],
				}
			: null,
	};
}

const parser = edjsHTML();

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
	searchParams: Promise<{ variant?: string }>;
}) {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	const { product } = await executeGraphQL(ProductDetailsDocument, {
		variables: {
			slug: decodeURIComponent(params.slug),
			channel: params.channel,
			locale: localeEnum,
		},
		revalidate: 60,
	});

	if (!product) {
		notFound();
	}

	const productSafe = product as typeof product & WithTranslation & WithMedia & WithAttributes;
	const productName = productSafe.translation?.name || product.name;
	const rawDescription = productSafe.translation?.description || product.description;
	const description = rawDescription ? parser.parse(JSON.parse(rawDescription)) : null;

	const variants = product.variants;
	const selectedVariantID = searchParams.variant;
	const selectedVariant = variants?.find(({ id }) => id === selectedVariantID);

	// --- BRAND LOGIC ---
	// Since we only get an ID, we cannot easily link to /pages/[slug] directly without an extra query.
	// For now, we will create a Search Link which effectively shows the brand's items.
	// Fix: Added optional chaining to a.attribute?.slug to prevent TS error if attribute is possibly undefined
	const brandAttr = productSafe.attributes?.find(
		(a) => a.attribute?.slug?.includes("brand") && a.values.length > 0,
	);
	const brandValue = brandAttr?.values[0];

	async function getRelatedProducts() {
		if (!product?.category?.slug) return [];
		const { category } = await executeGraphQL(ProductListByCategoryDocument, {
			variables: {
				slug: product.category.slug,
				channel: params.channel,
				locale: localeEnum,
			},
			revalidate: 60,
		});

		const allRelated = category?.products?.edges.map((e) => e.node) || [];
		// Filter out current product and take top 4
		return allRelated.filter((p) => p.id !== product.id).slice(0, 4);
	}

	const relatedProducts = await getRelatedProducts();

	// We construct a link to your Brand Page if we can guess the slug (often name-lowercased),
	// OR we use a search fallback.
	// Let's try to assume slug ~ name for now, or link to search.
	const brandName = brandValue?.name;
	// Simple slugify for the link (fallback)
	const brandSlugFallback = brandName?.toLowerCase().replace(/\s+/g, "-");

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
				locale: localeEnum,
			},
			cache: "no-cache",
		});

		revalidatePath(`/${params.channel}/${params.locale}/cart`);
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
					name: `${productName} - ${selectedVariant.name}`,
					description: product.seoDescription || `${productName} - ${selectedVariant.name}`,
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
					name: productName,
					description: product.seoDescription || productName,
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

	const hasMedia = Array.isArray(productSafe.media) && productSafe.media.length > 0;
	const images: ProductImage[] = hasMedia
		? (productSafe.media as ProductImage[])
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

			{/* --- BREADCRUMBS --- */}
			<div className="border-b border-stone-200 bg-stone-50 px-4 py-4 md:px-8">
				<nav className="mx-auto flex max-w-[1920px] items-center space-x-2 font-sans text-xs uppercase tracking-widest text-gray-500">
					<Link
						href={`/${params.channel}/${params.locale}`}
						className="transition-colors hover:text-terracotta"
					>
						Home
					</Link>
					<span className="text-gray-300">/</span>
					{product.category ? (
						<>
							<Link
								href={`/${params.channel}/${params.locale}/categories/${product.category.slug}`}
								className="transition-colors hover:text-terracotta"
							>
								{product.category.name}
							</Link>
							<span className="text-gray-300">/</span>
						</>
					) : null}
					<span className="max-w-[200px] truncate font-bold text-gray-900 md:max-w-none">{productName}</span>
				</nav>
			</div>

			<form action={addItem} className="h-full">
				<div className="mx-auto max-w-[1920px] md:grid md:min-h-screen md:grid-cols-12 md:gap-0">
					{/* --- LEFT: The Visual & Story (60%) --- */}
					<div className="bg-stone-50 md:col-span-7 lg:col-span-8">
						<div className="flex flex-col">
							{images.map((img, idx) => (
								<div
									key={idx}
									className="relative flex h-[50vh] w-full items-center justify-center border-b border-stone-200 last:border-0 md:h-[85vh]"
								>
									<Image
										src={img.url}
										alt={img.alt || productName}
										fill
										className="object-contain p-8 mix-blend-multiply"
										sizes="(max-width: 768px) 100vw, 60vw"
										priority={idx === 0}
									/>
								</div>
							))}
						</div>

						<div className="max-w-4xl px-6 py-16 md:px-20 md:py-24">
							{description && (
								<div className="prose prose-lg prose-stone max-w-none prose-headings:font-serif prose-a:text-terracotta">
									{description.map((content) => (
										<div key={content} dangerouslySetInnerHTML={{ __html: xss(content) }} />
									))}
								</div>
							)}

							{!description && (
								<p className="text-lg leading-relaxed text-gray-600">
									This product adheres to the Salp Euro-Standard certification for authentic craftsmanship.
									Created in verified European workshops using locally sourced materials.
								</p>
							)}
						</div>
					</div>

					{/* --- RIGHT: Purchase & Context Rail (40% - Sticky) --- */}
					{/* Liquid Glass Effect */}
					<div className="relative border-l border-white/20 bg-stone-50/80 backdrop-blur-xl md:col-span-5 lg:col-span-4">
						<div className="flex flex-col justify-between px-6 py-8 md:sticky md:top-0 md:h-screen md:overflow-y-auto md:px-12 md:py-16">
							<div className="mb-8">
								{/* --- BRAND HEADER --- */}
								{brandValue && brandName ? (
									<LinkWithChannel
										// Try to link to the page using a slugified name.
										// Since we can't get the real slug easily without a 2nd query, this is the best assumption.
										// Or fallback to search.
										href={`/pages/${brandSlugFallback}`}
										channel={params.channel}
										locale={params.locale}
										className="group mb-6 flex items-center gap-3"
									>
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-xs font-bold text-white shadow-sm">
											{brandName.substring(0, 2).toUpperCase()}
										</div>
										<span className="font-sans text-xs uppercase tracking-wide text-gray-500 transition-colors group-hover:text-terracotta">
											{brandName} • Official Partner
										</span>
									</LinkWithChannel>
								) : (
									<div className="mb-6 flex items-center gap-3">
										<div className="h-8 w-8 rounded-full bg-gray-200"></div>
										<span className="font-sans text-xs uppercase tracking-wide text-gray-500">
											Established 2025 • Europe
										</span>
									</div>
								)}

								<h1 className="mb-2 font-serif text-4xl text-gray-900 md:text-6xl">{productName}</h1>
								<p className="font-sans text-xs uppercase tracking-widest text-gray-500">
									{product.category?.name || "Utility Object"}
								</p>
							</div>

							<div className="mb-auto">
								<div className="mb-8 flex items-baseline gap-4 border-b border-stone-200 pb-8">
									<span className="font-serif text-3xl text-gray-900">{price}</span>
									{isAvailable && (
										<span className="flex items-center gap-2 font-sans text-xs font-medium uppercase tracking-wider text-emerald-600">
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
											locale={params.locale}
										/>
									</div>
								)}
								<div className="mb-8 rounded-xl border border-white/50 bg-white/40 p-6 backdrop-blur-sm">
									<ul className="space-y-3 text-xs font-medium text-gray-600">
										<li className="flex items-center gap-3">
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
												✓
											</span>
											Official Brand Partner
										</li>
										<li className="flex items-center gap-3">
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
												✓
											</span>
											Direct Shipping from Europe
										</li>
									</ul>
								</div>
								<div className="hidden md:block">
									<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/90 p-4 backdrop-blur-lg md:hidden">
					<div className="flex items-center gap-4">
						<div className="flex flex-shrink-0 flex-col">
							<span className="font-sans text-[10px] uppercase text-gray-500">Total</span>
							<span className="font-serif text-lg text-gray-900">{price}</span>
						</div>
						<div className="flex-grow">
							<AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
						</div>
					</div>
				</div>
			</form>

			{relatedProducts.length > 0 && (
				<div className="border-t border-stone-200 bg-stone-100 px-4 py-16 md:px-8 md:py-24">
					<div className="mx-auto max-w-[1920px]">
						<h3 className="mb-8 font-serif text-2xl text-gray-900 md:mb-12 md:text-3xl">Curated Pairings</h3>
						<div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 lg:grid-cols-4">
							{relatedProducts.map((relatedProduct) => {
								const name = relatedProduct.translation?.name || relatedProduct.name;
								return (
									<Link
										key={relatedProduct.id}
										href={`/${params.channel}/${params.locale}/products/${relatedProduct.slug}`}
										className="group block"
									>
										<div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-200">
											{relatedProduct.thumbnail && (
												<Image
													src={relatedProduct.thumbnail.url}
													alt={relatedProduct.thumbnail.alt || name}
													fill
													className="object-cover transition-transform duration-700 group-hover:scale-105"
													sizes="(max-width: 768px) 50vw, 25vw"
												/>
											)}
											<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 via-25% to-transparent transition-opacity group-hover:opacity-90" />
											<div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
												<div className="flex flex-col text-white">
													<h3 className="font-serif text-xl font-medium leading-tight">{name}</h3>
													<div className="mt-1 h-0.5 w-8 bg-terracotta opacity-0 transition-opacity group-hover:opacity-100" />
												</div>
												<span className="rounded bg-white/20 px-2 py-1 font-sans text-sm font-bold text-white/90 backdrop-blur-md">
													{formatMoney(
														relatedProduct.pricing?.priceRange?.start?.gross.amount || 0,
														relatedProduct.pricing?.priceRange?.start?.gross.currency || "EUR",
													)}
												</span>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
