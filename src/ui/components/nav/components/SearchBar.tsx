"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearch, useSearchBox, useHits, Configure } from "react-instantsearch";
import { getAlgoliaIndexName } from "@/lib/algolia-config";

// Define the shape of the data coming from Algolia
interface ProductHit {
	objectID: string;
	slug: string;
	name: string;
	// Saleor App usually sends thumbnail as a string, but we handle both cases
	thumbnail?: string | { url: string } | null;
	media?: Array<{ url: string; type: string }>;
	category?: {
		name: string;
	} | null;
	grossPrice?:
		| number
		| {
				amount: number;
		  };
}

// --- ALGOLIA CLIENT INITIALIZATION ---
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const searchClient =
	appId && apiKey
		? algoliasearch(appId, apiKey)
		: ({
				search: (args: unknown) => {
					// Handle Algolia v5 request structure safely without using 'any'
					let requests: unknown[] = [];

					if (Array.isArray(args)) {
						requests = args;
					} else if (
						typeof args === "object" &&
						args !== null &&
						"requests" in args &&
						Array.isArray((args as { requests: unknown[] }).requests)
					) {
						requests = (args as { requests: unknown[] }).requests;
					}

					return Promise.resolve({
						results: requests.map(() => ({
							hits: [],
							nbHits: 0,
							nbPages: 0,
							page: 0,
							processingTimeMS: 0,
							hitsPerPage: 0,
							exhaustiveNbHits: false,
							query: "",
							params: "",
						})),
					});
				},
			} as unknown as ReturnType<typeof algoliasearch>);

// --- Sub-Component: The Input Field ---
function CustomSearchBox({ onFocus }: { onFocus: () => void }) {
	const { query, refine, clear } = useSearchBox();
	const router = useRouter();
	const params = useParams();
	const currentChannel = (params?.channel as string) || "default-channel";

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter") {
			e.preventDefault();
			// FIX: Redirect to our NEW custom search page: /{channel}/search?q={query}
			router.push(`/${currentChannel}/search?q=${encodeURIComponent(query)}`);

			(e.target as HTMLInputElement).blur();
		}
	};

	return (
		<div className="relative w-full">
			<input
				type="text"
				placeholder="Search for products, brands, or categories..."
				value={query}
				onChange={(e) => refine(e.target.value)}
				onFocus={onFocus}
				onKeyDown={handleKeyDown}
				className="w-full appearance-none rounded-full border border-stone-100 bg-stone-50 py-2.5 pl-4 pr-10 font-sans text-carbon transition-colors duration-200 placeholder:text-stone-400 focus:border-terracotta focus:outline-none focus:ring-1 focus:ring-terracotta"
			/>

			{query ? (
				<button
					onClick={() => {
						clear();
						refine("");
					}}
					className="absolute right-3 top-3 text-stone-400 transition-colors hover:text-terracotta"
					aria-label="Clear search"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="h-5 w-5"
					>
						<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			) : (
				<span className="pointer-events-none absolute right-3 top-3 text-stone-400">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth={1.5}
						stroke="currentColor"
						className="h-5 w-5"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
						/>
					</svg>
				</span>
			)}
		</div>
	);
}

// --- Sub-Component: The Results Dropdown ---
function CustomHits({ isVisible, onClose }: { isVisible: boolean; onClose: () => void }) {
	const { hits = [] } = useHits();
	const params = useParams();
	const currentChannel = (params?.channel as string) || "default-channel";

	if (!isVisible || hits.length === 0) return null;

	return (
		<div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-xl border border-stone-100 bg-white shadow-xl">
			{hits.map((hit) => {
				const product = hit as unknown as ProductHit;

				// Robust Image Logic
				let imageUrl = "";
				if (typeof product.thumbnail === "string") {
					imageUrl = product.thumbnail;
				} else if (typeof product.thumbnail === "object" && product.thumbnail?.url) {
					imageUrl = product.thumbnail.url;
				} else if (product.media && product.media.length > 0) {
					imageUrl = product.media[0].url;
				}

				return (
					<Link
						key={product.objectID}
						href={`/${currentChannel}/products/${product.slug}`}
						onClick={onClose}
						className="group flex items-center gap-4 border-b border-stone-100 p-4 transition-colors duration-150 last:border-0 hover:bg-stone-50"
					>
						{/* Image Fallback */}
						<div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-stone-100 bg-stone-50">
							{imageUrl ? (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img
									src={imageUrl}
									alt={product.name}
									className="h-full w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center font-mono text-[10px] text-stone-400">
									IMG
								</div>
							)}
						</div>

						<div className="min-w-0 flex-1">
							<h4 className="truncate font-serif text-base leading-tight text-carbon">{product.name}</h4>
							{product.category?.name && (
								<p className="mt-0.5 truncate font-sans text-xs text-stone-500">{product.category.name}</p>
							)}
						</div>

						<div className="whitespace-nowrap font-sans text-sm font-medium text-terracotta">
							{typeof product.grossPrice === "object" && product.grossPrice !== null
								? product.grossPrice.amount
								: product.grossPrice}
						</div>
					</Link>
				);
			})}
		</div>
	);
}

// --- Main Component ---
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
		<div ref={containerRef} className="relative mx-auto w-full max-w-md">
			<InstantSearch searchClient={searchClient} indexName={indexName} key={indexName}>
				<Configure hitsPerPage={5} />
				<CustomSearchBox onFocus={() => setShowResults(true)} />
				<CustomHits isVisible={showResults} onClose={() => setShowResults(false)} />
			</InstantSearch>
		</div>
	);
}
