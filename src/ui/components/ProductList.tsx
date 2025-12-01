import { ProductElement } from "./ProductElement";
import { type ProductListItemFragment } from "@/gql/graphql";

export const ProductList = ({
	products,
	channel,
	locale,
}: {
	products: readonly ProductListItemFragment[];
	channel?: string;
	locale?: string;
}) => {
	return (
		<ul
			role="list"
			data-testid="ProductList"
			className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
		>
			{products.map((product, index) => (
				<ProductElement
					key={product.id}
					product={product}
					priority={index < 2}
					loading={index < 3 ? "eager" : "lazy"}
					// Pass the context down
					channel={channel}
					locale={locale}
				/>
			))}
		</ul>
	);
};
