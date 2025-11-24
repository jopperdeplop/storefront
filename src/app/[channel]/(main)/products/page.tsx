import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductListPaginatedDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Pagination } from "@/ui/components/Pagination";
import { ProductsPerPage } from "@/app/config";

export const metadata = {
	title: "Catalog | Euro-Standard",
	description: "Verified European inventory.",
};

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: {
	params: Promise<{ channel: string }>;
	searchParams: Promise<{
		cursor: string | string[] | undefined;
	}>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : null;

	const { products } = await executeGraphQL(ProductListPaginatedDocument, {
		variables: {
			first: ProductsPerPage,
			after: cursor,
			channel: params.channel,
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
		<section className="min-h-screen bg-stone-50 pb-16 text-gray-900">
			<div className="mx-auto max-w-[1920px] px-4 md:px-8">
				{/* --- HEADER: Editorial Style --- */}
				<div className="mb-12 mt-12 flex items-baseline justify-between border-b border-gray-200 pb-6">
					<div>
						<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-400">
							Verified Inventory
						</span>
						<h1 className="font-serif text-3xl font-medium text-gray-900 md:text-4xl">All Objects</h1>
					</div>
					<span className="font-mono text-xs text-gray-500">{products.totalCount} ITEMS</span>
				</div>

				{/* --- BROKEN GRID LAYOUT --- */}
				<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
					{products.edges.map(({ node: product }) => {
						// Safe price access to avoid lint errors
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
											className="object-cover transition-transform duration-700 group-hover:scale-105"
											sizes="(max-width: 768px) 50vw, 25vw"
										/>
									)}

									{/* Hover Overlay: Editorial "Shop Now" */}
									<div className="absolute inset-0 flex flex-col justify-end bg-black/0 p-4 transition-colors duration-300 group-hover:bg-black/5">
										{/* Minimalist overlay logic handled by CSS in globals or implicit here */}
									</div>

									{/* Product Info */}
									<div className="absolute bottom-0 left-0 right-0 border-t border-stone-100 bg-white p-4">
										<div className="flex flex-col gap-1">
											<h3 className="truncate font-serif text-base font-medium text-gray-900 group-hover:text-terracotta">
												{product.name}
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

					{/* --- KNOWLEDGE CARD INJECTION  --- */}
					{/* Replaces the old "Optimization Tip" with Editorial "Did You Know?" */}
					<div className="col-span-2 flex aspect-[2/1] flex-col justify-center bg-stone-100 p-8 text-gray-900 md:aspect-auto">
						<span className="mb-3 font-mono text-xs uppercase text-terracotta">Material Standard</span>
						<h3 className="mb-4 font-serif text-2xl font-medium leading-tight md:text-3xl">Did you know?</h3>
						<p className="max-w-md text-sm leading-relaxed text-gray-600">
							80% of our wood comes from certified FSC forests in Poland. We prioritize renewable European
							sourcing to minimize ecological debt.
						</p>
						<div className="mt-6">
							<span className="cursor-pointer border-b border-gray-900 pb-1 font-mono text-xs uppercase tracking-widest hover:border-terracotta hover:text-terracotta">
								Read our Sourcing Guide
							</span>
						</div>
					</div>
				</div>

				<div className="mt-12 border-t border-gray-200 pt-8">
					<Pagination
						pageInfo={{
							...products.pageInfo,
							// FIX: Hardcode missing fields to null/false
							hasPreviousPage: false,
							startCursor: null,
							// FIX: Include channel in basePathname for correct pagination links
							basePathname: `/${params.channel}/products`,
							urlSearchParams: newSearchParams,
						}}
					/>
				</div>
			</div>
		</section>
	);
}
