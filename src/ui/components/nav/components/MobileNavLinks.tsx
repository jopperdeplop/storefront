import { NavLink } from "./NavLink";
import { NavItem } from "./NavItem";
import { executeGraphQL } from "@/lib/graphql";
import { MenuGetBySlugDocument } from "@/gql/graphql";

export const MobileNavLinks = async ({ channel }: { channel: string }) => {
	const navLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "navbar", channel },
		revalidate: 60 * 60, // 1 hour
	});

	return (
		<>
			{/* FIX: Use relative path. NavLink adds the channel automatically. */}
			<div className="w-full border-b border-stone-200 py-3 lg:border-none lg:py-0">
				<NavLink href="/products">All Items</NavLink>
			</div>

			{/* Dynamic Menu Items */}
			{navLinks.menu?.items?.map((item) => <NavItem key={item.id} item={item} channel={channel} />)}
		</>
	);
};
