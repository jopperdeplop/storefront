/* This file exists for the mobile dropdown as well / same as NavItem.tsx */

import { NavLink } from "./NavLink";
import { NavItem } from "./NavItem";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument } from "@/gql/graphql";

export const MobileNavLinks = async ({ channel }: { channel: string }) => {
	const navLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel },
		revalidate: 60 * 60 * 24,
	});

	return (
		<>
			{/* Static 'All' Link */}
			<div className="w-full border-b border-gray-100 py-2">
				<NavLink href="/products">ALL ITEMS</NavLink>
			</div>

			{/* Render Dynamic Items using the 'Plus Icon' component */}
			{navLinks.menu?.items?.map((item) => <NavItem key={item.id} item={item} />)}
		</>
	);
};
