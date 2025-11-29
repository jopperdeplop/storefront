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
				if (item.category) {
					return (
						<NavLink key={item.id} href={`/categories/${item.category.slug}`}>
							{item.category.name}
						</NavLink>
					);
				}
				if (item.collection) {
					return (
						<NavLink key={item.id} href={`/collections/${item.collection.slug}`}>
							{item.collection.name}
						</NavLink>
					);
				}
				if (item.page) {
					return (
						<NavLink key={item.id} href={`/pages/${item.page.slug}`}>
							{item.page.title}
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
							{item.name}
						</Link>
					);
				}
				return null;
			})}
		</>
	);
};
