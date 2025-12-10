"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Menu } from "lucide-react";

interface MenuItem {
	id: string;
	name: string;
	url?: string | null;
	translation?: { name?: string | null } | null;
	category?: {
		name: string;
		slug: string;
		translation?: { name?: string | null } | null;
	} | null;
	collection?: {
		name: string;
		slug: string;
		translation?: { name?: string | null } | null;
	} | null;
	page?: {
		title: string;
		slug: string;
		translation?: { title?: string | null } | null;
	} | null;
	children?: MenuItem[] | null;
}

// Helper to resolve the label and href for a menu item
function resolveMenuItem(item: MenuItem) {
	const menuTranslation = item.translation?.name;
	const categoryLabel = item.category?.translation?.name || item.category?.name;
	const collectionLabel = item.collection?.translation?.name || item.collection?.name;
	const pageLabel = item.page?.translation?.title || item.page?.title;
	const label = menuTranslation || categoryLabel || collectionLabel || pageLabel || item.name;

	let href = "#";
	if (item.category) href = `/categories/${item.category.slug}`;
	if (item.collection) href = `/collections/${item.collection.slug}`;
	if (item.page) href = `/pages/${item.page.slug}`;
	if (item.url) href = item.url;

	return { label, href };
}

function DropdownItem({ item, onClose }: { item: MenuItem; onClose: () => void }) {
	const [isHovered, setIsHovered] = useState(false);
	const hasChildren = item.children && item.children.length > 0;
	const { label, href } = resolveMenuItem(item);

	return (
		<div
			className="relative"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Link
				href={href}
				onClick={onClose}
				className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-stone-50 hover:text-terracotta"
			>
				<span>{label}</span>
				{hasChildren && <ChevronRight size={14} className="text-gray-400" />}
			</Link>

			{/* Flyout Menu (Right) */}
			{hasChildren && isHovered && (
				<div className="animate-in fade-in zoom-in-95 absolute left-full top-0 ml-2 w-64 rounded-xl border border-stone-100 bg-white p-2 shadow-xl duration-200">
					{/* Safe Triangle / Bridge to prevent closing when moving cursor across gap */}
					<div className="absolute -left-4 top-0 h-full w-4 bg-transparent" />

					<div className="flex flex-col gap-1">
						{item.children?.map((child) => <DropdownItem key={child.id} item={child} onClose={onClose} />)}
					</div>
				</div>
			)}
		</div>
	);
}

export function DropdownMenu({ items }: { items: MenuItem[] }) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div className="relative" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-md bg-stone-100 px-4 py-2.5 text-sm font-medium text-gray-900 transition-colors hover:bg-stone-200"
			>
				<Menu size={18} />
				<span>Categories</span>
				<ChevronDown
					size={16}
					className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</button>

			{isOpen && (
				<div className="animate-in fade-in zoom-in-95 absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-stone-100 bg-white p-2 shadow-xl duration-200">
					<div className="flex flex-col gap-1">
						<Link
							href="/products"
							onClick={() => setIsOpen(false)}
							className="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-stone-50 hover:text-terracotta"
						>
							All Products
						</Link>
						<div className="my-1 h-px bg-stone-100" />

						{items.map((item) => (
							<DropdownItem key={item.id} item={item} onClose={() => setIsOpen(false)} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}
