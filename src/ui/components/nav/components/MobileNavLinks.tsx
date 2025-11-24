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
			{/* Static "All Items" Link - Styled with Stone palette */}
			<div className="w-full border-b border-stone-200 py-3 lg:border-none lg:py-0">
				<NavLink href={`/${channel}/products`}>All Items</NavLink>
			</div>

			{/* Dynamic Menu Items - Passing channel prop down for correct routing */}
			{navLinks.menu?.items?.map((item) => <NavItem key={item.id} item={item} channel={channel} />)}
		</>
	);
};
