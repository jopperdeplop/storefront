import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { OrderDirection, ProductOrderField, SearchProductsDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Pagination } from "@/ui/components/Pagination";
import { ProductsPerPage } from "@/app/config";

export const metadata = {
	title: "Search | Salp Industrial Utility",
	description: "Search results.",
};

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: {
	searchParams: Promise<Record<"query" | "cursor", string | string[] | undefined>>;
	params: Promise<{ channel: string }>;
}) {
	const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
	const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : null;
	const searchValue = searchParams.query;

	if (!searchValue) {
		notFound();
	}

	if (Array.isArray(searchValue)) {
		const firstValidSearchValue = searchValue.find((v) => v.length > 0);
		if (!firstValidSearchValue) {
			notFound();
		}
		redirect(`/search?${new URLSearchParams({ query: firstValidSearchValue }).toString()}`);
	}

	const { products } = await executeGraphQL(SearchProductsDocument, {
		variables: {
			first: ProductsPerPage,
			search: searchValue,
			after: cursor,
			sortBy: ProductOrderField.Rating,
			sortDirection: OrderDirection.Asc,
			channel: params.channel,
		},
		revalidate: 60,
	});

	if (!products) {
		notFound();
	}

	const newSearchParams = new URLSearchParams({
		query: searchValue,
		...(products.pageInfo.endCursor && { cursor: products.pageInfo.endCursor }),
	});

	return (
		<section className="min-h-screen bg-vapor p-4 pb-16 text-carbon md:p-8">
			<div className="mx-auto max-w-[1920px]">
				{/* --- HEADER --- */}
				<div className="mb-8 border-b border-gray-300 pb-4">
					<h1 className="text-xl font-bold uppercase tracking-widest">
						Search Protocol: <span className="text-cobalt">&quot;{searchValue}&quot;</span>
					</h1>
					<span className="font-mono text-xs text-gray-500">{products.totalCount} RESULT(S) FOUND</span>
				</div>

				{products.totalCount && products.totalCount > 0 ? (
					<>
						{/* --- UNIFORM GRID (Matches Collection/Category Pages) --- */}
						<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
							{products.edges.map(({ node: product }) => {
								// Safe price access
								const priceAmount = product.pricing?.priceRange?.start?.gross.amount || 0;
								const priceCurrency = product.pricing?.priceRange?.start?.gross.currency || "EUR";

								return (
									<Link
										key={product.id}
										href={`/${params.channel}/products/${product.slug}`}
										className="group relative col-span-1 aspect-[3/4] bg-white transition-all duration-300 hover:z-10 focus:z-10"
									>
										<div className="relative h-full w-full overflow-hidden">
											{product.thumbnail && (
												<Image
													src={product.thumbnail.url}
													alt={product.thumbnail.alt || product.name}
													fill
													className="object-cover transition-transform duration-500 group-hover:scale-105"
													sizes="(max-width: 768px) 50vw, 25vw"
												/>
											)}
											{/* Hover Overlay */}
											<div className="absolute inset-0 bg-carbon/0 transition-colors duration-300 group-hover:bg-carbon/5" />

											{/* Utility Spec Info */}
											<div className="absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white p-3 md:p-4">
												<div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
													<h3 className="w-full truncate text-xs font-bold uppercase tracking-wide text-carbon md:text-sm">
														{product.name}
													</h3>
													<span className="whitespace-nowrap rounded-sm bg-gray-100 px-2 py-1 font-mono text-xs transition-colors group-hover:bg-cobalt group-hover:text-white md:text-sm">
														{formatPrice(priceAmount, priceCurrency)}
													</span>
												</div>
											</div>
										</div>
									</Link>
								);
							})}
						</div>

						{/* --- PAGINATION --- */}
						<div className="mt-12 border-t border-gray-300 pt-8">
							<Pagination
								pageInfo={{
									...products.pageInfo,
									// FIX: Manually supply missing fields to satisfy TS interface
									hasPreviousPage: false, // Search query doesn't return this, assume false
									startCursor: null,
									basePathname: `/search`,
									urlSearchParams: newSearchParams,
								}}
							/>
						</div>
					</>
				) : (
					<div className="flex h-64 flex-col items-center justify-center text-center">
						<h2 className="text-lg font-bold uppercase text-gray-400">No data found</h2>
						<p className="font-mono text-xs text-gray-500">Adjust search parameters.</p>
					</div>
				)}
			</div>
		</section>
	);
}
