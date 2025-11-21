import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ProductListPaginatedDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Pagination } from "@/ui/components/Pagination";
import { ProductsPerPage } from "@/app/config";

export const metadata = {
	title: "Catalog | Salp Industrial Utility",
	description: "Complete inventory.",
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
		<section className="min-h-screen bg-vapor p-4 pb-16 text-carbon md:p-8">
			<div className="mx-auto max-w-[1920px]">
				{/* --- HEADER --- */}
				<div className="mb-8 flex items-baseline justify-between border-b border-gray-300 pb-4">
					<h1 className="text-xl font-bold uppercase tracking-widest">Full Inventory</h1>
					<span className="font-mono text-xs text-gray-500">{products.totalCount} UNITS</span>
				</div>

				{/* --- UNIFORM GRID --- */}
				<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
					{products.edges.map(({ node: product }) => {
						// Safe price access to avoid lint errors
						const priceAmount = product.pricing?.priceRange?.start?.gross.amount || 0;
						const priceCurrency = product.pricing?.priceRange?.start?.gross.currency || "EUR";

						return (
							<Link
								key={product.id}
								href={`/${params.channel}/products/${product.slug}`}
								// Uniform sizing: col-span-1 and aspect-[3/4] for ALL items
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
									{/* Digital Material Overlay */}
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

					{/* --- KNOWLEDGE CARD INJECTION --- */}
					<div className="col-span-2 flex aspect-[2/1] flex-col justify-center bg-carbon p-6 text-vapor md:p-8">
						<span className="mb-2 font-mono text-xs uppercase text-cobalt">Optimization Tip</span>
						<p className="max-w-md text-lg font-bold leading-tight md:text-2xl">
							&quot;Industrial minimalism reduces decision fatigue.&quot;
						</p>
					</div>
				</div>

				<div className="mt-12 border-t border-gray-300 pt-8">
					<Pagination
						pageInfo={{
							...products.pageInfo,
							// FIX: Hardcode missing fields to null/false instead of reading them from 'products.pageInfo'
							hasPreviousPage: false,
							startCursor: null,
							basePathname: `/products`,
							urlSearchParams: newSearchParams,
						}}
					/>
				</div>
			</div>
		</section>
	);
}
