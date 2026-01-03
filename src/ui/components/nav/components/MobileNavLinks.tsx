import { NavLink } from "./NavLink";
import { NavItem, type MenuItem } from "./NavItem";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesListDocument, type LanguageCodeEnum } from "@/gql/graphql";

export const MobileNavLinks = async ({ channel, locale }: { channel: string; locale: string }) => {
	let menuItems: MenuItem[] = [];

	try {
		const result = await executeGraphQL(CategoriesListDocument, {
			variables: {
				locale: locale.toUpperCase() as LanguageCodeEnum,
			},
			revalidate: 60 * 60, // 1 hour
		});

		const categories = result?.categories?.edges.map((e) => e.node) || [];

		// Map to MenuItem structure
		menuItems = categories.map((cat) => ({
			id: cat.id,
			name: cat.name,
			category: {
				name: cat.name,
				slug: cat.slug,
				translation: cat.translation,
			},
			children:
				cat.children?.edges.map((child) => ({
					id: child.node.id,
					name: child.node.name,
					category: {
						name: child.node.name,
						slug: child.node.slug,
						translation: child.node.translation,
					},
				})) || [],
		})) as MenuItem[];
	} catch (error) {
		console.error("Failed to fetch MobileNavLinks:", error);
		return null;
	}

	return (
		<>
			{/* Static "All Items" Link */}
			<div className="w-full border-b border-stone-200 py-3 lg:border-none lg:py-0">
				<NavLink href="/products">All Items</NavLink>
			</div>

			{/* Dynamic Menu Items */}
			{menuItems.map((item) => (
				<NavItem key={item.id} item={item} channel={channel} locale={locale} />
			))}
		</>
	);
};
