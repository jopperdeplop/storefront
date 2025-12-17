import Link from "next/link";
import { type PageInfo } from "@/gql/graphql";

interface PaginationProps {
	pageInfo: PageInfo;
	basePath: string;
}

export function Pagination({ pageInfo, basePath }: PaginationProps) {
	// --- NEXT LINK ---
	// To go Next: We need 'cursor' = endCursor. We MUST remove 'before'.
	const nextParams = new URLSearchParams();
	if (pageInfo.endCursor) {
		nextParams.set("cursor", pageInfo.endCursor);
	}

	// --- PREV LINK ---
	// To go Prev: We need 'before' = startCursor. We MUST remove 'cursor'.
	const prevParams = new URLSearchParams();
	if (pageInfo.startCursor) {
		prevParams.set("before", pageInfo.startCursor);
	}

	const hasNext = pageInfo.hasNextPage && !!pageInfo.endCursor;
	const hasPrev = pageInfo.hasPreviousPage && !!pageInfo.startCursor;

	return (
		<nav className="flex items-center justify-center gap-4 border-t border-stone-200 pt-12">
			{/* PREVIOUS */}
			{hasPrev ? (
				<Link
					href={`${basePath}?${prevParams.toString()}`}
					className="group inline-flex h-12 min-w-[120px] items-center justify-center rounded-full border border-gray-900 bg-white px-6 font-sans text-xs font-bold uppercase tracking-widest text-gray-900 transition-all hover:border-terracotta hover:bg-stone-50 hover:text-terracotta"
				>
					← Prev
				</Link>
			) : (
				<div className="inline-flex h-12 min-w-[120px] cursor-not-allowed select-none items-center justify-center rounded-full border border-stone-200 bg-stone-50 px-6 font-sans text-xs font-bold uppercase tracking-widest text-gray-300">
					← Prev
				</div>
			)}

			{/* NEXT */}
			{hasNext ? (
				<Link
					href={`${basePath}?${nextParams.toString()}`}
					className="group inline-flex h-12 min-w-[120px] items-center justify-center rounded-full border border-gray-900 bg-gray-900 px-6 font-sans text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-terracotta hover:bg-terracotta"
				>
					Next →
				</Link>
			) : (
				<div className="inline-flex h-12 min-w-[120px] cursor-not-allowed select-none items-center justify-center rounded-full border border-stone-200 bg-stone-50 px-6 font-sans text-xs font-bold uppercase tracking-widest text-gray-300">
					Next →
				</div>
			)}
		</nav>
	);
}
