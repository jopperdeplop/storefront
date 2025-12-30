"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearch, useSearchBox, useHits, Configure } from "react-instantsearch";
import { getAlgoliaIndexName } from "@/lib/algolia-config";

// --- Types ---
interface ProductHit {
	objectID: string;
	slug: string;
	name: string;
	thumbnail?: string | { url: string } | null;
	media?: Array<{ url: string; type: string }>;
	category?: {
		name: string;
	} | null;
	grossPrice?: number | { amount: number };
}

// --- ALGOLIA INIT ---
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const searchClient =
	appId && apiKey
		? algoliasearch(appId, apiKey)
		: ({
				search: (args: unknown) => {
					// Dummy client to prevent crashes if keys are missing
					return Promise.resolve({
						results: Array.isArray(args) ? args.map(() => ({ hits: [], nbHits: 0 })) : [],
					});
				},
			} as unknown as ReturnType<typeof algoliasearch>);

// --- SEARCH BOX COMPONENT ---
function CustomSearchBox({ onFocus }: { onFocus: () => void }) {
	const { query, refine, clear } = useSearchBox();
	const router = useRouter();
	const params = useParams();

	// FIX: Grab both Channel AND Locale
	const currentChannel = (params?.channel as string) || "default-channel";
	const currentLocale = (params?.locale as string) || "en";

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			// FIX: Redirect includes locale -> /eur/nl/search
			router.push(`/${currentChannel}/${currentLocale}/search?q=${encodeURIComponent(query)}`);
			(e.target as HTMLInputElement).blur();
		}
	};

	return (
		<div className="relative w-full">
			<input
				type="text"
				placeholder="Search Products & Brands"
				value={query}
				onChange={(e) => refine(e.target.value)}
				onFocus={onFocus}
				onKeyDown={handleKeyDown}
				className="w-full appearance-none rounded-md border border-stone-200 bg-white py-2.5 pl-4 pr-10 font-sans text-base text-carbon shadow-sm transition-all placeholder:text-stone-400 hover:border-stone-300 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
			/>
			{query && (
				<button
					onClick={() => {
						clear();
						refine("");
					}}
					className="absolute right-3 top-3 text-stone-400 hover:text-terracotta"
				>
					✕
				</button>
			)}
		</div>
	);
}

// --- HITS DROPDOWN ---
function CustomHits({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
	const { hits = [] } = useHits();
	const params = useParams();

	const currentChannel = (params?.channel as string) || "default-channel";
	const currentLocale = (params?.locale as string) || "en";

	if (!isVisible || hits.length === 0) return null;

	return (
		<div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-xl border border-stone-100 bg-white shadow-xl">
			{hits.map((hit) => {
				const product = hit as unknown as ProductHit;

				// Image extraction logic
				let imageUrl = "";
				if (typeof product.thumbnail === "string") imageUrl = product.thumbnail;
				else if (product.thumbnail?.url) imageUrl = product.thumbnail.url;
				else if (product.media?.[0]?.url) imageUrl = product.media[0].url;

				return (
					<Link
						key={product.objectID}
						// FIX: Link includes locale
						href={`/${currentChannel}/${currentLocale}/products/${product.slug}`}
						onClick={onClose}
						className="group flex items-center gap-4 border-b border-stone-100 p-4 hover:bg-stone-50"
					>
						<div className="relative size-12 shrink-0 overflow-hidden rounded bg-stone-50">
							{imageUrl && (
								<Image src={imageUrl} alt={product.name} fill className="object-cover" sizes="48px" />
							)}
						</div>
						<div className="min-w-0 flex-1">
							<h4 className="truncate font-serif text-base text-carbon">{product.name}</h4>
							{product.category?.name && <p className="text-xs text-stone-500">{product.category.name}</p>}
						</div>
					</Link>
				);
			})}
		</div>
	);
}

// --- ROOT SEARCH BAR ---
export function SearchBar() {
	const params = useParams();
	const [showResults, setShowResults] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	const currentChannel = (params?.channel as string) || "default-channel";
	const indexName = getAlgoliaIndexName(currentChannel);

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
				setShowResults(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	return (
		<div ref={containerRef} className="relative mx-auto w-full">
			<InstantSearch searchClient={searchClient} indexName={indexName}>
				<Configure hitsPerPage={5} />
				<CustomSearchBox onFocus={() => setShowResults(true)} />
				<CustomHits isVisible={showResults} onClose={() => setShowResults(false)} />
			</InstantSearch>
		</div>
	);
}
