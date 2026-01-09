import { ProductCard } from "./ProductCard";
import { executeGraphQL } from "@/lib/graphql";
import { ProductListDocument, type LanguageCodeEnum } from "@/gql/graphql";

interface BrandProductShowcaseProps {
	brandSlug: string;
	channel: string;
	locale: string;
}

export async function BrandProductShowcase({ brandSlug, channel, locale }: BrandProductShowcaseProps) {
	// Query products that have the brand attribute matching this brand slug
	// Note: This assumes products have a "brand" attribute with the brand slug as value
	const { products } = await executeGraphQL(ProductListDocument, {
		variables: {
			channel,
			first: 12,
			filter: {
				attributes: [
					{
						slug: "brand",
						values: [brandSlug],
					},
				],
			},
			locale: locale.toUpperCase() as LanguageCodeEnum,
		},
		revalidate: 60,
	});

	const productList = products?.edges?.map((edge) => edge.node) || [];

	if (productList.length === 0) {
		return null;
	}

	return (
		<section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
			<h2 className="mb-8 text-2xl font-bold text-neutral-900 md:text-3xl">Our Products</h2>

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:gap-6">
				{productList.map((product) => (
					<ProductCard key={product.id} product={product} channel={channel} locale={locale} />
				))}
			</div>
		</section>
	);
}
