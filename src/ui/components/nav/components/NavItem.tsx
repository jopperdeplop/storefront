"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

// --- EXPORTED TYPE ---
export type MenuItem = {
	id: string;
	name: string;
	url?: string | null;
	translation?: { name: string } | null;
	category?: {
		slug: string;
		name: string;
		translation?: { name: string } | null;
	} | null;
	collection?: {
		slug: string;
		name: string;
		translation?: { name: string } | null;
	} | null;
	page?: {
		slug: string;
		title: string;
		translation?: { title: string } | null;
	} | null;
	children?: MenuItem[] | null;
};

// --- HELPERS ---
const getLinkPath = (item: MenuItem) => {
	if (item.category) return `/categories/${item.category.slug}`;
	if (item.collection) return `/collections/${item.collection.slug}`;
	if (item.page) return `/pages/${item.page.slug}`;
	return item.url || `/`;
};

const getLabel = (item: MenuItem) => {
	return (
		item.translation?.name ||
		item.category?.translation?.name ||
		item.category?.name ||
		item.collection?.translation?.name ||
		item.collection?.name ||
		item.page?.translation?.title ||
		item.page?.title ||
		item.name ||
		""
	);
};

// --- COMPONENT ---
interface NavItemProps {
	item: MenuItem;
	channel: string;
	locale: string;
}

export const NavItem = ({ item, channel, locale }: NavItemProps) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const hasChildren = item.children && item.children.length > 0;
	const href = getLinkPath(item);
	const label = getLabel(item);

	const closeMenu = () => {
		const closeBtn = document.querySelector("[data-testid=close-menu-button]") as HTMLElement;
		closeBtn?.click();
	};

	return (
		<li className="w-full border-b border-stone-200 last:border-0 lg:w-auto lg:border-none">
			<div className="group flex items-center justify-between py-4 lg:py-0">
				{/* Pass channel/locale explicitely to avoid unused var warning and ensure link accuracy */}
				<LinkWithChannel
					href={href}
					channel={channel}
					locale={locale}
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

			{/* Sub-Menu */}
			{hasChildren && isExpanded && item.children && (
				<ul className="animate-in slide-in-from-top-1 fade-in ml-1 flex flex-col gap-3 border-l-2 border-stone-100 pb-4 pl-4 duration-200 lg:absolute lg:left-0 lg:top-full lg:w-48 lg:border lg:border-gray-200 lg:bg-white lg:p-4 lg:shadow-xl">
					{item.children.map((child) => {
						const childHref = getLinkPath(child);
						const childLabel = getLabel(child);

						return (
							<li key={child.id}>
								<LinkWithChannel
									href={childHref}
									channel={channel}
									locale={locale}
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
