"use client";

import { useState } from "react";
import Link from "next/link";

// Define the shape of the Menu Item based on Saleor's API
type MenuItem = {
	id: string;
	name: string;
	url?: string | null;
	category?: { slug: string; name: string } | null;
	collection?: { slug: string; name: string } | null;
	page?: { slug: string; title: string } | null;
	children?: MenuItem[] | null;
};

// FIX: Added channel argument to prepend it to paths
const getLinkPath = (item: MenuItem, channel: string) => {
	if (item.category) return `/${channel}/categories/${item.category.slug}`;
	if (item.collection) return `/${channel}/collections/${item.collection.slug}`;
	if (item.page) return `/${channel}/pages/${item.page.slug}`;
	return item.url || `/${channel}`;
};

// FIX: Added channel to Props
export const NavItem = ({ item, channel }: { item: MenuItem; channel: string }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const hasChildren = item.children && item.children.length > 0;
	// FIX: Pass channel to getLinkPath
	const href = getLinkPath(item, channel);
	const label = item.name || item.category?.name || item.collection?.name || item.page?.title || "";

	return (
		<li className="w-full border-b border-gray-100 last:border-0 lg:w-auto lg:border-none">
			<div className="group flex items-center justify-between py-2 lg:py-0">
				<Link
					href={href}
					className="text-sm font-bold uppercase tracking-wide text-carbon transition-colors hover:text-cobalt md:text-base"
				>
					{label}
				</Link>

				{hasChildren && (
					<button
						onClick={(e) => {
							e.preventDefault();
							setIsExpanded(!isExpanded);
						}}
						className="p-1 text-carbon hover:text-cobalt focus:outline-none lg:ml-2 lg:p-0"
						aria-label="Toggle sub-menu"
					>
						<span className="font-mono text-lg font-bold">{isExpanded ? "[-]" : "[+]"}</span>
					</button>
				)}
			</div>

			{hasChildren && isExpanded && item.children && (
				<ul className="animate-in slide-in-from-top-1 fade-in ml-1 flex flex-col gap-2 border-l border-gray-200 bg-vapor/30 pb-3 pl-4 duration-200 lg:absolute lg:left-0 lg:top-full lg:w-48 lg:border lg:border-gray-100 lg:bg-white lg:p-4 lg:shadow-xl">
					{item.children.map((child) => {
						// FIX: Pass channel to child link generation
						const childHref = getLinkPath(child, channel);
						const childLabel =
							child.name || child.category?.name || child.collection?.name || child.page?.title || "";

						return (
							<li key={child.id}>
								<Link
									href={childHref}
									className="block font-mono text-xs uppercase text-gray-500 decoration-cobalt underline-offset-4 transition-colors hover:text-carbon hover:underline"
								>
									{childLabel}
								</Link>
							</li>
						);
					})}
				</ul>
			)}
		</li>
	);
};
