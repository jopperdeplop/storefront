/*This exists for dropdowns in mobile menu*/
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

const getLinkPath = (item: MenuItem) => {
	if (item.category) return `/categories/${item.category.slug}`;
	if (item.collection) return `/collections/${item.collection.slug}`;
	if (item.page) return `/pages/${item.page.slug}`;
	return item.url || "/";
};

export const NavItem = ({ item }: { item: MenuItem }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	const hasChildren = item.children && item.children.length > 0;
	const href = getLinkPath(item);
	const label = item.name || item.category?.name || item.collection?.name || item.page?.title || "";

	return (
		<li className="w-full border-b border-gray-100 last:border-0">
			<div className="group flex items-center justify-between py-2">
				<Link
					href={href}
					className="text-sm font-bold uppercase tracking-wide text-carbon transition-colors hover:text-cobalt"
				>
					{label}
				</Link>

				{hasChildren && (
					<button
						onClick={(e) => {
							e.preventDefault();
							setIsExpanded(!isExpanded);
						}}
						className="p-2 text-carbon hover:text-cobalt focus:outline-none"
						aria-label="Toggle sub-menu"
					>
						<span className="font-mono text-lg font-bold">{isExpanded ? "[-]" : "[+]"}</span>
					</button>
				)}
			</div>

			{hasChildren && isExpanded && item.children && (
				<ul className="animate-in slide-in-from-top-1 fade-in ml-1 flex flex-col gap-2 border-l border-gray-200 bg-vapor/30 pb-3 pl-4 duration-200">
					{item.children.map((child) => {
						const childHref = getLinkPath(child);
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
