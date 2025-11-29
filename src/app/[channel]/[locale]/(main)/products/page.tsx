import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductListPaginatedDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Pagination } from "@/ui/components/Pagination";
import { ProductsPerPage } from "@/app/config";

// --- FIX: Safe Type Extension for Translations ---
interface WithTranslation {
	translation?: {
		name?: string;
	} | null;
}
// ------------------------------------------------

export const metadata = {
	title: "Catalog | Euro-Standard",
	description: "Verified European inventory.",
};

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: {
	params: Promise<{ channel: string; locale: string }>;
	searchParams: Promise<{
		cursor: string | string[] | undefined;
	}>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	// UPDATED: Locale Logic
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;
	const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : null;

	const { products } = await executeGraphQL(ProductListPaginatedDocument, {
		variables: {
			first: ProductsPerPage,
			after: cursor,
			channel: params.channel,
			// UPDATED: Pass locale
			locale: localeEnum,
		},
		revalidate: 60,
	});

	if (!products) {
		notFound();
	}

	const newSearchParams = new URLSearchParams({
		...(products.pageInfo.endCursor && { cursor: products.pageInfo.endCursor }),
	});

	return (
		<div className="min-h-screen bg-stone-50 text-gray-900">
			{/* --- HEADER: Editorial Style (Static) --- */}
			<div className="border-b border-stone-200 bg-white transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-6 md:px-8 md:py-8">
					<div className="flex items-end justify-between">
						<div>
							<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-400">
								Verified Inventory
							</span>
							<h1 className="font-serif text-3xl font-medium text-gray-900 md:text-5xl">All Objects</h1>
						</div>
						<span className="font-mono text-xs text-gray-500">{products.totalCount} ITEMS</span>
					</div>
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
						{/* --- BROKEN GRID LAYOUT --- */}
						<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 sm:grid-cols-3 xl:grid-cols-4">
							{products.edges.map(({ node: product }) => {
								// Safe price access to avoid lint errors
								const priceAmount = product.pricing?.priceRange?.start?.gross.amount || 0;
								const priceCurrency = product.pricing?.priceRange?.start?.gross.currency || "EUR";

								// Fix: Cast individual product safely inside the map
								const productWithTranslation = product as typeof product & WithTranslation;

								return (
									<Link
										key={product.id}
										// UPDATED: Link logic
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
													{/* UPDATED: Translation logic */}
													<h3 className="truncate font-serif text-base font-medium text-gray-900 group-hover:text-terracotta">
														{productWithTranslation.translation?.name || product.name}
													</h3>
													<div className="flex items-center justify-between">
														<span className="font-mono text-xs text-gray-400">
															{product.category?.name || "Object"}
														</span>
														<span className="font-mono text-sm text-gray-900">
															{formatPrice(priceAmount, priceCurrency)}
														</span>
													</div>
												</div>
											</div>
										</div>
									</Link>
								);
							})}
						</div>

						{/* --- PAGINATION --- */}
						<div className="mt-12 border-t border-gray-200 pt-8">
							<Pagination
								pageInfo={{
									...products.pageInfo,
									hasPreviousPage: false,
									startCursor: null,
									// UPDATED: Pagination path
									basePathname: `/${params.channel}/${params.locale}/products`,
									urlSearchParams: newSearchParams,
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
