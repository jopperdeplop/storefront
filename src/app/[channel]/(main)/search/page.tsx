"use client";

import { Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { liteClient as algoliasearch } from "algoliasearch/lite";
import {
	InstantSearch,
	useHits,
	Configure,
	RefinementList,
	useInstantSearch,
	usePagination,
} from "react-instantsearch";
import { getAlgoliaIndexName } from "@/lib/algolia-config";

// --- ALGOLIA CONFIGURATION ---
const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

const searchClient =
	appId && apiKey
		? algoliasearch(appId, apiKey)
		: ({
				search: (args: unknown) => {
					let requests: unknown[] = [];
					if (Array.isArray(args)) requests = args;
					else if (typeof args === "object" && args !== null && "requests" in args) {
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

interface ProductHit {
	objectID: string;
	slug: string;
	name: string;
	thumbnail?: string | { url: string } | null;
	media?: Array<{ url: string; type: string }>;
	category?: { name: string } | null;
	grossPrice?: number | { amount: number };
}

const formatPrice = (amount: number) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(amount);

// --- COMPONENT: Results Grid ---
function SearchResults({ channel }: { channel: string }) {
	const { hits } = useHits();

	if (hits.length === 0) return null;

	return (
		<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 sm:grid-cols-3 xl:grid-cols-4">
			{hits.map((hit) => {
				const product = hit as unknown as ProductHit;

				let imageUrl = "";
				if (typeof product.thumbnail === "string") imageUrl = product.thumbnail;
				else if (product.thumbnail?.url) imageUrl = product.thumbnail.url;
				else if (product.media?.[0]?.url) imageUrl = product.media[0].url;

				const price =
					typeof product.grossPrice === "object" && product.grossPrice !== null
						? product.grossPrice.amount
						: product.grossPrice || 0;

				return (
					<Link
						key={product.objectID}
						href={`/${channel}/products/${product.slug}`}
						className="group relative aspect-[3/4] bg-white transition-all duration-300 hover:z-10 focus:z-10"
					>
						<div className="relative h-full w-full overflow-hidden">
							{imageUrl && (
								<Image
									src={imageUrl}
									alt={product.name}
									fill
									className="object-cover transition-transform duration-700 group-hover:scale-105"
									sizes="(max-width: 768px) 50vw, 25vw"
								/>
							)}
							<div className="absolute inset-0 flex flex-col justify-end bg-black/0 p-4 transition-colors duration-300 group-hover:bg-black/5" />
							<div className="absolute bottom-0 left-0 right-0 border-t border-stone-100 bg-white p-4">
								<div className="flex flex-col gap-1">
									<h3 className="truncate font-serif text-base font-medium text-gray-900 group-hover:text-terracotta">
										{product.name}
									</h3>
									<div className="flex items-center justify-between">
										<span className="font-mono text-xs text-gray-400">
											{product.category?.name || "Object"}
										</span>
										<span className="font-mono text-sm text-gray-900">{formatPrice(price)}</span>
									</div>
								</div>
							</div>
						</div>
					</Link>
				);
			})}
		</div>
	);
}

// --- COMPONENT: No Results State ---
function NoResultsBoundary() {
	const { status, results } = useInstantSearch();

	if (status === "idle" && results.nbHits === 0) {
		return (
			<div className="flex h-96 flex-col items-center justify-center border border-stone-200 bg-white p-8 text-center">
				<h2 className="mb-2 font-serif text-2xl text-gray-900">No results found</h2>
				<p className="font-mono text-xs uppercase tracking-wide text-gray-500">
					Try adjusting your search terms or filters
				</p>
			</div>
		);
	}
	return null;
}

// --- COMPONENT: Pagination (Custom Styling) ---
function CustomPagination() {
	const { currentRefinement, nbPages, refine } = usePagination();

	if (nbPages <= 1) return null;

	return (
		<div className="mt-12 flex justify-center gap-2 font-mono text-xs">
			{new Array(nbPages).fill(null).map((_, index) => {
				const page = index + 1;
				const isSelected = currentRefinement === index;

				return (
					<button
						key={page}
						onClick={() => refine(index)}
						className={`
                            flex h-8 w-8 items-center justify-center border transition-colors
                            ${
															isSelected
																? "border-terracotta bg-terracotta text-white"
																: "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
														}
                        `}
					>
						{page}
					</button>
				);
			})}
		</div>
	);
}

// --- MAIN SEARCH CONTENT (Wrapped Logic) ---
function SearchContent() {
	const params = useParams();
	const searchParams = useSearchParams();

	const channel = (params?.channel as string) || "default-channel";
	const query = searchParams.get("q") || "";
	const indexName = getAlgoliaIndexName(channel);

	return (
		<div className="min-h-screen bg-stone-50 text-gray-900">
			<InstantSearch
				searchClient={searchClient}
				indexName={indexName}
				key={indexName}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Configure query={query} hitsPerPage={20} />

				{/* --- HEADER --- */}
				<div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur transition-all">
					<div className="mx-auto max-w-[1920px] px-4 py-6 md:px-8 md:py-8">
						<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-400">
							Search Results
						</span>
						<h1 className="font-serif text-3xl font-medium text-gray-900 md:text-5xl">
							&quot;<span className="text-terracotta">{query}</span>&quot;
						</h1>
					</div>
				</div>

				<div className="mx-auto max-w-[1920px] px-4 pb-16 pt-8 md:px-8">
					<div className="flex flex-col gap-8 lg:flex-row">
						{/* --- SIDEBAR --- */}
						<aside className="hidden w-64 shrink-0 lg:block">
							<div className="sticky top-48 flex flex-col gap-8">
								<div>
									<h3 className="mb-3 font-serif text-sm font-bold uppercase tracking-wide">Categories</h3>
									<RefinementList
										attribute="category.name"
										classNames={{
											list: "space-y-2 font-mono text-xs text-gray-500",
											item: "group",
											label: "flex items-center gap-2 cursor-pointer hover:text-terracotta transition-colors",
											checkbox:
												"w-3.5 h-3.5 border-gray-300 rounded-sm text-terracotta focus:ring-terracotta",
											count: "ml-auto text-[10px] text-gray-300 group-hover:text-terracotta",
										}}
									/>
								</div>
							</div>
						</aside>

						{/* --- MAIN CONTENT --- */}
						<div className="flex-1">
							<NoResultsBoundary />
							<SearchResults channel={channel} />
							<CustomPagination />
						</div>
					</div>
				</div>
			</InstantSearch>
		</div>
	);
}

// --- DEFAULT EXPORT (Suspense Wrapper) ---
export default function SearchPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-stone-50 font-mono text-xs text-gray-400">
					LOADING SEARCH...
				</div>
			}
		>
			<SearchContent />
		</Suspense>
	);
}
