import Link from "next/link";
import { NavLink } from "./NavLink";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument, type LanguageCodeEnum } from "@/gql/graphql";

export const NavLinks = async ({ channel, locale }: { channel: string; locale: string }) => {
	let navLinks = null;

	try {
		navLinks = await executeGraphQL(MenuGetBySlugDocument, {
			variables: {
				slug: "navbar",
				channel,
				locale: locale.toUpperCase() as LanguageCodeEnum,
			},
			revalidate: 60 * 60, // 1 hour
		});
	} catch (error) {
		console.error("Failed to fetch NavLinks:", error);
		// Return null to render nothing instead of crashing the page
		return null;
	}

	if (!navLinks?.menu?.items) {
		return null;
	}

	return (
		<>
			{/* CORRECT: Use "/products", NOT `/${channel}/products` */}
			<NavLink href="/products">All</NavLink>

			{navLinks.menu.items.map((item) => {
				// --- TRANSLATION LOGIC ---
				// 1. Check if the Menu Item itself has a translation (e.g. "Best Sellers" -> "Meilleurs Vendeurs")
				const menuTranslation = item.translation?.name;

				// 2. Check for Linked Entity Translations (Category, Collection, Page)
				// We use optional chaining because 'item.category' might be null
				const categoryLabel = item.category?.translation?.name || item.category?.name;
				const collectionLabel = item.collection?.translation?.name || item.collection?.name;
				const pageLabel = item.page?.translation?.title || item.page?.title;

				// 3. Determine Final Label
				// Priority: Menu Translation -> Entity Label (Translated or Original) -> Menu Item Name (Fallback)
				const label = menuTranslation || categoryLabel || collectionLabel || pageLabel || item.name;

				if (item.category) {
					return (
						<NavLink key={item.id} href={`/categories/${item.category.slug}`}>
							{label}
						</NavLink>
					);
				}
				if (item.collection) {
					return (
						<NavLink key={item.id} href={`/collections/${item.collection.slug}`}>
							{label}
						</NavLink>
					);
				}
				if (item.page) {
					return (
						<NavLink key={item.id} href={`/pages/${item.page.slug}`}>
							{label}
						</NavLink>
					);
				}
				if (item.url) {
					return (
						<Link
							key={item.id}
							href={item.url}
							className="flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-terracotta"
						>
							{label}
						</Link>
					);
				}
				return null;
			})}
		</>
	);
};
