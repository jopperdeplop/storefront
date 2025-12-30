import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";

import { ProductListByCollectionDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { StoreSidebar } from "@/ui/components/StoreSidebar";
import { ProductCard } from "@/ui/components/ProductCard";

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string; locale: string }> },
	_parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: {
			slug: params.slug,
			channel: params.channel,
			locale: localeEnum,
		},
		revalidate: 60,
	});
	return {
		title: `${collection?.name || "Collection"} | Euro-Standard`,
		description: collection?.seoDescription || collection?.description,
	};
};

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
}) {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: {
			slug: params.slug,
			channel: params.channel,
			locale: localeEnum,
		},
		revalidate: 60,
	});

	if (!collection || !collection.products) {
		notFound();
	}

	const name = collection.translation?.name || collection.name;
	const products = collection.products;

	// Note: The description parsing logic was removed because 'parsedContent'
	// was unused in the JSX, causing lint errors.

	return (
		<div className="min-h-screen bg-white text-gray-900">
			{/* --- HEADER: Editorial Style --- */}
			<div className="border-b border-stone-200 bg-white transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-6 md:p-8">
					<span className="mb-2 block font-sans text-xs uppercase tracking-widest text-gray-500">
						Collection
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
