"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { LanguageCodeEnum } from "@/gql/graphql";

// Define a type for the category node structure we expect
interface CategoryNode {
	id: string;
	name: string;
	slug: string;
	translation?: { name?: string | null } | null;
	children?: {
		edges: Array<{
			node: CategoryNode;
		}>;
	} | null;
}

interface SidebarCategoryItemProps {
	category: CategoryNode;
	channel: string;
	locale: LanguageCodeEnum;
}

export function SidebarCategoryItem({ category, channel, locale }: SidebarCategoryItemProps) {
	const [isOpen, setIsOpen] = useState(false);
	const hasChildren = category.children?.edges && category.children.edges.length > 0;
	const displayName = category.translation?.name || category.name;

	return (
		<li>
			<div className="group flex items-center justify-between">
				<Link
					href={`/${channel}/${locale}/categories/${category.slug}`}
					className="flex-1 text-sm text-gray-500 transition-colors hover:text-gray-900 group-hover:underline"
				>
					{displayName}
				</Link>
				{hasChildren && (
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="ml-2 p-1 text-gray-400 hover:text-gray-900"
						aria-label={isOpen ? "Collapse category" : "Expand category"}
					>
						{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
					</button>
				)}
			</div>

			{hasChildren && isOpen && (
				<ul className="ml-4 mt-2 space-y-2 border-l border-gray-100 pl-4">
					{category.children!.edges.map(({ node: child }) => (
						<SidebarCategoryItem key={child.id} category={child} channel={channel} locale={locale} />
					))}
				</ul>
			)}
		</li>
	);
}
