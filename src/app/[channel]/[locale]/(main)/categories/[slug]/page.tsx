import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ProductListByCategoryDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

// --- FIX: Safe Type Extension for Translations ---
// This avoids using 'any' while handling fields that might not be in the generated GraphQL types yet.
interface WithTranslation {
	translation?: {
		name?: string;
		description?: string;
	} | null;
}
// ------------------------------------------------

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string; locale: string }> },
	_parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: {
			slug: params.slug,
			channel: params.channel,
			locale: localeEnum,
		},
		revalidate: 60,
	});
	return {
		title: `${category?.name || "Category"} | Euro-Standard`,
		description: category?.seoDescription || category?.description,
	};
};

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
}) {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: {
			slug: params.slug,
			channel: params.channel,
			locale: localeEnum,
		},
		revalidate: 60,
	});

	if (!category || !category.products) {
		notFound();
	}

	// --- FIX: Safe Type Casting ---
	// We cast to the original type & our translation interface to satisfy linter
	const categoryWithTranslation = category as typeof category & WithTranslation;

	const name = categoryWithTranslation.translation?.name || category.name;
	// Use the description if you need to pass it to meta or simple text,
	// but unused JSON parsing logic has been removed to fix lint errors.
	const products = category.products;

	return (
		<div className="min-h-screen bg-stone-50 text-gray-900">
			{/* --- HEADER: Editorial Style --- */}
			<div className="border-b border-stone-200 bg-white transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-6 md:px-8 md:py-8">
					<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-400">
						Category
					</span>
					<h1 className="font-serif text-3xl font-medium text-gray-900 md:text-5xl">{name}</h1>
				</div>
			</div>

			<div className="mx-auto max-w-[1920px] px-4 pb-16 pt-8 md:px-8">
				<div className="flex flex-col gap-8 lg:flex-row">
					{/* --- SIDEBAR: Minimalist Filter --- */}
					<aside className="hidden w-64 shrink-0 lg:block">
						<div className="sticky top-32 flex flex-col gap-8">
							<div>
								<h3 className="mb-3 font-serif text-sm font-bold uppercase tracking-wide">Material</h3>
								<ul className="space-y-2 font-mono text-xs text-gray-500">
									<li className="cursor-pointer hover:text-terracotta hover:underline">Oak & Walnut</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Ceramic</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Leather</li>
								</ul>
							</div>
							<div>
								<h3 className="mb-3 font-serif text-sm font-bold uppercase tracking-wide">Origin</h3>
								<ul className="space-y-2 font-mono text-xs text-gray-500">
									<li className="cursor-pointer hover:text-terracotta hover:underline">Portugal</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Poland</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Denmark</li>
								</ul>
							</div>
							<div>
								<h3 className="mb-3 font-serif text-sm font-bold uppercase tracking-wide">Type</h3>
								<ul className="space-y-2 font-mono text-xs text-gray-500">
									<li className="cursor-pointer hover:text-terracotta hover:underline">Atelier (Handmade)</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">
										Brand (Manufactured)
									</li>
								</ul>
							</div>
						</div>
					</aside>

					{/* --- MAIN CONTENT --- */}
					<div className="flex-1">
						{/* --- PRODUCT GRID --- */}
						<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 sm:grid-cols-3 xl:grid-cols-4">
							{products.edges.map(({ node: product }) => {
								// Fix: Cast individual product safely inside the map
								const productWithTranslation = product as typeof product & WithTranslation;

								return (
									<Link
										key={product.id}
										href={`/${params.channel}/${params.locale}/products/${product.slug}`}
										className="group relative aspect-[3/4] bg-white transition-all duration-300 hover:z-10 focus:z-10"
									>
										<div className="relative h-full w-full overflow-hidden">
											{product.thumbnail && (
												<Image
													src={product.thumbnail.url}
													alt={product.thumbnail.alt || product.name}
													fill
													className="object-cover transition-transform duration-700 group-hover:scale-105"
													sizes="(max-width: 768px) 50vw, 25vw"
												/>
											)}

											{/* Hover Overlay */}
											<div className="absolute inset-0 flex flex-col justify-end bg-black/0 p-4 transition-colors duration-300 group-hover:bg-black/5" />

											{/* Product Info */}
											<div className="absolute bottom-0 left-0 right-0 border-t border-stone-100 bg-white p-4">
												<div className="flex flex-col gap-1">
													<h3 className="truncate font-serif text-base font-medium text-gray-900 group-hover:text-terracotta">
														{productWithTranslation.translation?.name || product.name}
													</h3>
													<div className="flex items-center justify-between">
														<span className="font-mono text-xs text-gray-400">
															{product.category?.name || "Object"}
														</span>
														<span className="font-mono text-sm text-gray-900">
															{formatPrice(
																product.pricing?.priceRange?.start?.gross.amount || 0,
																product.pricing?.priceRange?.start?.gross.currency || "EUR",
															)}
														</span>
													</div>
												</div>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
