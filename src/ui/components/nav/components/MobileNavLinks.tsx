import { NavLink } from "./NavLink";
import { NavItem } from "./NavItem";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument } from "@/gql/graphql";

export const MobileNavLinks = async ({ channel }: { channel: string }) => {
	const navLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel },
		revalidate: 0, // 24 hours
	});

	return (
		<>
			{/* FIX: Added /${channel} to the path */}
			<div className="w-full border-b border-gray-100 py-2 lg:border-none lg:py-0">
				<NavLink href={`/${channel}/products`}>ALL ITEMS</NavLink>
			</div>

			{/* FIX: Passed channel prop to NavItem */}
			{navLinks.menu?.items?.map((item) => <NavItem key={item.id} item={item} channel={channel} />)}
		</>
	);
};
