import { DropdownMenu } from "./DropdownMenu";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument, type LanguageCodeEnum } from "@/gql/graphql";

export async function CategoryDropdown({ channel, locale }: { channel: string; locale: string }) {
	let menuItems = null;

	try {
		const result = await executeGraphQL(MenuGetBySlugDocument, {
			variables: {
				slug: "navbar",
				channel,
				locale: locale.toUpperCase() as LanguageCodeEnum,
			},
			revalidate: 60 * 60,
		});
		menuItems = result?.menu?.items;
	} catch (error) {
		console.error("Failed to fetch menu items:", error);
	}

	if (!menuItems) return null;

	return <DropdownMenu items={menuItems} />;
}
