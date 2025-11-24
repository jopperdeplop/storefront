"use client";

import { useState } from "react";
// FIX: Use LinkWithChannel instead of next/link to handle channel routing automatically
import { Plus, Minus } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

type MenuItem = {
	id: string;
	name: string;
	url?: string | null;
	category?: { slug: string; name: string } | null;
	collection?: { slug: string; name: string } | null;
	page?: { slug: string; title: string } | null;
	children?: MenuItem[] | null;
};

// FIX: Removed channel argument. Return raw paths.
const getLinkPath = (item: MenuItem) => {
	if (item.category) return `/categories/${item.category.slug}`;
	if (item.collection) return `/collections/${item.collection.slug}`;
	if (item.page) return `/pages/${item.page.slug}`;
	return item.url || `/`;
};

export const NavItem = ({ item }: { item: MenuItem; channel: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const hasChildren = item.children && item.children.length > 0;

	// FIX: Generate raw path without channel prefix
	const href = getLinkPath(item);

	const label = item.name || item.category?.name || item.collection?.name || item.page?.title || "";

	const closeMenu = () => {
		const closeBtn = document.querySelector("[data-testid=close-menu-button]") as HTMLElement;
		closeBtn?.click();
	};

	return (
		<li className="w-full border-b border-stone-200 last:border-0 lg:w-auto lg:border-none">
			<div className="group flex items-center justify-between py-4 lg:py-0">
				{/* FIX: LinkWithChannel automatically prepends the current channel */}
				<LinkWithChannel
					href={href}
					onClick={hasChildren ? undefined : closeMenu}
					className="text-sm font-medium uppercase tracking-wider text-gray-900 transition-colors hover:text-terracotta md:text-base"
				>
					{label}
				</LinkWithChannel>

				{hasChildren && (
					<button
						onClick={(e) => {
							e.preventDefault();
							setIsExpanded(!isExpanded);
						}}
						className="flex h-8 w-8 items-center justify-center text-gray-400 hover:text-terracotta focus:outline-none lg:ml-2 lg:h-auto lg:w-auto"
						aria-label="Toggle sub-menu"
					>
						{isExpanded ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
					</button>
				)}
			</div>

			{hasChildren && isExpanded && item.children && (
				<ul className="animate-in slide-in-from-top-1 fade-in ml-1 flex flex-col gap-3 border-l-2 border-stone-100 pb-4 pl-4 duration-200 lg:absolute lg:left-0 lg:top-full lg:w-48 lg:border lg:border-gray-200 lg:bg-white lg:p-4 lg:shadow-xl">
					{item.children.map((child) => {
						const childHref = getLinkPath(child);
						const childLabel =
							child.name || child.category?.name || child.collection?.name || child.page?.title || "";

						return (
							<li key={child.id}>
								<LinkWithChannel
									href={childHref}
									onClick={closeMenu}
									className="block font-sans text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors hover:text-terracotta"
								>
									{childLabel}
								</LinkWithChannel>
							</li>
						);
					})}
				</ul>
			)}
		</li>
	);
};
