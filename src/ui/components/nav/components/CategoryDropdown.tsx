import { DropdownMenu } from "./DropdownMenu";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesListDocument, type LanguageCodeEnum } from "@/gql/graphql";

export async function CategoryDropdown({ locale }: { channel: string; locale: string }) {
	let menuItems = null;

	try {
		const result = await executeGraphQL(CategoriesListDocument, {
			variables: {
				locale: locale.toUpperCase() as LanguageCodeEnum,
			},
			revalidate: 60 * 60,
		});

		const categories = result?.categories?.edges.map((e) => e.node) || [];

		// Map Categories to MenuItem structure
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
		}));
	} catch (error) {
		console.error("Failed to fetch categories:", error);
	}

	if (!menuItems || menuItems.length === 0) return null;

	return <DropdownMenu items={menuItems} />;
}
