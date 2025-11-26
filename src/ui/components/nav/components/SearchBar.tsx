"use client";

import { liteClient as algoliasearch } from "algoliasearch/lite";
import { InstantSearch, SearchBox, Hits, Configure, useInstantSearch } from "react-instantsearch";
import { useRouter } from "next/navigation";

const searchClient = algoliasearch(
	process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || "",
	process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || "",
);

// Custom component to handle "Enter" key logic and hide empty results
function CustomSearchBox({ channel }: { channel: string }) {
	const { results } = useInstantSearch();
	const router = useRouter();

	// Safely check if results exist and have hits
	const hasResults = results?.nbHits ? results.nbHits > 0 : false;
	const query = results?.query || "";

	return (
		<div className="relative w-full">
			<SearchBox
				placeholder="Search products & brands..."
				onSubmit={(event) => {
					event.preventDefault(); // Prevent default InstantSearch submit
					if (query.trim()) {
						// Redirect to standard search page on Enter if not clicking a result
						router.push(`/${channel}/search?query=${encodeURIComponent(query)}`);
					}
				}}
				classNames={{
					root: "w-full",
					form: "relative flex w-full items-center",
					input:
						"h-10 w-full rounded-full border border-stone-200 bg-stone-100 px-6 py-2 pr-10 font-sans text-sm text-gray-900 transition-all placeholder:text-gray-400 hover:border-stone-300 hover:bg-stone-200 focus:border-terracotta focus:bg-white focus:outline-none focus:ring-1 focus:ring-terracotta",
					submit: "absolute right-3 order-last text-gray-400 hover:text-terracotta p-1",
					reset: "hidden",
					loadingIcon: "hidden",
				}}
			/>

			{/* Only show dropdown if there is a query and results */}
			{query.length > 0 && hasResults && (
				<div className="absolute left-0 top-12 z-50 w-full overflow-hidden rounded-lg border border-stone-200 bg-white shadow-xl">
					<Hits
						hitComponent={({ hit }) => (
							<a
								href={`/products/${hit.slug}`}
								className="block border-b border-stone-100 px-4 py-3 transition-colors last:border-0 hover:bg-stone-50"
							>
								<p className="text-sm font-medium text-gray-900">{hit.name as string}</p>
							</a>
						)}
					/>
				</div>
			)}
		</div>
	);
}

export function SearchBar({ channel }: { channel: string }) {
	return (
		<div className="relative my-2 w-full lg:w-80">
			<InstantSearch
				searchClient={searchClient}
				indexName={process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || "prod_products"}
				future={{ preserveSharedStateOnUnmount: true }}
			>
				<Configure hitsPerPage={5} />
				<CustomSearchBox channel={channel} />
			</InstantSearch>
		</div>
	);
}
