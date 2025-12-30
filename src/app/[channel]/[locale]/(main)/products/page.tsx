import { notFound } from "next/navigation";
import { ProductListPaginatedDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { Pagination } from "@/ui/components/Pagination";
import { StoreSidebar } from "@/ui/components/StoreSidebar";
import { ProductCard } from "@/ui/components/ProductCard";
import { ProductsPerPage } from "@/app/config";

// --- FIX: Safe Type Extension for Translations ---

export const metadata = {
	title: "Catalog | Euro-Standard",
	description: "Verified European inventory.",
};

export default async function Page(props: {
	params: Promise<{ channel: string; locale: string }>;
	searchParams: Promise<{
		cursor: string | string[] | undefined;
		before: string | string[] | undefined;
	}>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	// UPDATED: Locale Logic
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;
	const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : null;
	const before = typeof searchParams.before === "string" ? searchParams.before : null;

	const { products } = await executeGraphQL(ProductListPaginatedDocument, {
		variables: {
			// If we have 'before', we are going backwards: use 'last'
			// Otherwise use 'first' (default)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			first: (before ? undefined : ProductsPerPage) as any,
			after: cursor, // 'cursor' is the 'after' param
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			last: (before ? ProductsPerPage : undefined) as any,
			before: before,
			channel: params.channel,
			// UPDATED: Pass locale
			locale: localeEnum,
		},
		revalidate: 60,
	});

	if (!products) {
		notFound();
	}

	return (
		<div className="min-h-screen bg-white text-gray-900">
			{/* --- HEADER: Editorial Style (Static) --- */}
			<div className="border-b border-stone-200 bg-white transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-6 md:p-8">
					<div className="flex items-end justify-between">
						<div>
							<span className="mb-2 block font-sans text-xs uppercase tracking-widest text-gray-500">
								Curated Suggestions
							</span>
							<h1 className="font-serif text-3xl text-gray-900 md:text-5xl">All Products</h1>
						</div>
						<span className="font-sans text-xs text-gray-500">{products.totalCount} ITEMS</span>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-[1920px] px-4 pb-16 pt-8 md:px-8">
				<div className="flex flex-col gap-8 lg:flex-row">
					{/* --- SIDEBAR: Dynamic Store Sidebar --- */}
					<StoreSidebar channel={params.channel} locale={localeEnum} />

					{/* --- MAIN CONTENT --- */}
					<div className="flex-1">
						{/* --- PRODUCT GRID --- */}
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
							{products.edges.map(({ node: product }) => (
								<ProductCard
									key={product.id}
									product={product}
									channel={params.channel}
									locale={params.locale}
								/>
							))}
						</div>

						{/* --- PAGINATION --- */}
						<div className="mt-12 border-t border-gray-200 pt-8">
							<Pagination
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								pageInfo={products.pageInfo as any}
								basePath={`/${params.channel}/${params.locale}/products`}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
