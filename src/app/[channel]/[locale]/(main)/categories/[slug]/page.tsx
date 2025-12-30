import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";

import { ProductListByCategoryDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { StoreSidebar } from "@/ui/components/StoreSidebar";
import { ProductCard } from "@/ui/components/ProductCard";

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
	// const categoryWithTranslation = category as typeof category & WithTranslation;

	const name = category.translation?.name || category.name;
	// Use the description if you need to pass it to meta or simple text,
	// but unused JSON parsing logic has been removed to fix lint errors.
	const products = category.products;

	return (
		<div className="min-h-screen bg-white text-gray-900">
			{/* --- HEADER: Editorial Style --- */}
			<div className="border-b border-stone-200 bg-white transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-6 md:p-8">
					<span className="mb-2 block font-sans text-xs uppercase tracking-widest text-gray-500">
						Category
					</span>
					<h1 className="font-serif text-3xl text-gray-900 md:text-5xl">{name}</h1>
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
					</div>
				</div>
			</div>
		</div>
	);
}
