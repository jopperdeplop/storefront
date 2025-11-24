import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

export function Pagination({
	pageInfo,
}: {
	pageInfo: {
		hasNextPage: boolean;
		hasPreviousPage: boolean;
		startCursor?: string | null;
		endCursor?: string | null;
		basePathname: string;
		urlSearchParams?: URLSearchParams;
	};
}) {
	// --- NEXT BUTTON LOGIC ---
	const nextSearchParams = new URLSearchParams(pageInfo.urlSearchParams?.toString());

	// For "Next", we want to go 'after' the endCursor
	if (pageInfo.endCursor) {
		nextSearchParams.set("cursor", pageInfo.endCursor); // Using 'cursor' to match your page.tsx logic
		nextSearchParams.delete("before"); // Ensure we don't have conflicting directions
	}

	// --- PREV BUTTON LOGIC ---
	const prevSearchParams = new URLSearchParams(pageInfo.urlSearchParams?.toString());

	// For "Prev", we want to go 'before' the startCursor
	if (pageInfo.startCursor) {
		prevSearchParams.set("before", pageInfo.startCursor);
		prevSearchParams.delete("cursor"); // Remove forward cursor to avoid conflict
	}

	return (
		<nav className="flex items-center justify-center gap-4 border-t border-stone-200 pt-12">
			{/* --- PREVIOUS BUTTON --- */}
			{pageInfo.hasPreviousPage ? (
				<LinkWithChannel
					href={`${pageInfo.basePathname}?${prevSearchParams.toString()}`}
					className="group inline-flex h-12 min-w-[120px] items-center justify-center border border-gray-900 bg-white px-6 text-xs font-bold uppercase tracking-widest text-gray-900 transition-all hover:border-terracotta hover:text-terracotta"
				>
					← Prev
				</LinkWithChannel>
			) : (
				<div
					aria-disabled="true"
					className="inline-flex h-12 min-w-[120px] cursor-not-allowed select-none items-center justify-center border border-stone-200 bg-stone-50 px-6 text-xs font-bold uppercase tracking-widest text-gray-300"
				>
					← Prev
				</div>
			)}

			{/* --- NEXT BUTTON --- */}
			{pageInfo.hasNextPage ? (
				<LinkWithChannel
					href={`${pageInfo.basePathname}?${nextSearchParams.toString()}`}
					className="group inline-flex h-12 min-w-[120px] items-center justify-center border border-gray-900 bg-gray-900 px-6 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-terracotta hover:bg-terracotta"
				>
					Next →
				</LinkWithChannel>
			) : (
				<div
					aria-disabled="true"
					className="inline-flex h-12 min-w-[120px] cursor-not-allowed select-none items-center justify-center border border-stone-200 bg-stone-50 px-6 text-xs font-bold uppercase tracking-widest text-gray-300"
				>
					Next →
				</div>
			)}
		</nav>
	);
}
