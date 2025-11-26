"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
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
	const { query, refine } = useSearchBox();

	return (
		<div className="relative w-full">
			<input
				type="search"
				placeholder="Search for products..."
				value={query}
				onChange={(e) => refine(e.target.value)}
				onFocus={onFocus}
				className="w-full rounded-md border border-neutral-200 bg-neutral-50 px-4 py-2 text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
			<span className="pointer-events-none absolute right-3 top-2.5 text-neutral-400">🔍</span>
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
		<div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[80vh] overflow-y-auto rounded-md border border-neutral-100 bg-white shadow-xl">
			{hits.map((hit) => {
				const product = hit as unknown as ProductHit;

				// Robust Image Logic: Try thumbnail string -> thumbnail object -> first media item
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
						className="flex items-center gap-4 border-b border-neutral-100 p-3 transition-colors last:border-0 hover:bg-neutral-50"
					>
						{/* Image Fallback */}
						<div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
							{imageUrl ? (
								/* eslint-disable-next-line @next/next/no-img-element */
								<img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
							) : (
								<div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
									Img
								</div>
							)}
						</div>

						<div className="min-w-0 flex-1">
							<h4 className="truncate text-sm font-medium text-neutral-900">{product.name}</h4>
							{product.category?.name && (
								<p className="truncate text-xs text-neutral-500">{product.category.name}</p>
							)}
						</div>

						<div className="whitespace-nowrap text-sm font-semibold text-neutral-900">
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
