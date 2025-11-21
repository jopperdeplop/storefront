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
	// We only handle forward navigation ('after')
	const nextSearchParams = new URLSearchParams(pageInfo.urlSearchParams?.toString());
	if (pageInfo.endCursor) {
		nextSearchParams.set("after", pageInfo.endCursor);
		nextSearchParams.delete("before"); // Ensure clean state
	}

	return (
		<nav className="flex items-center justify-center border-t border-gray-300 pt-12">
			{/* --- NEXT BUTTON --- */}
			{pageInfo.hasNextPage ? (
				<LinkWithChannel
					href={`${pageInfo.basePathname}?${nextSearchParams.toString()}`}
					className="group inline-flex h-12 min-w-[120px] items-center justify-center border border-carbon bg-carbon px-6 text-xs font-bold uppercase tracking-widest text-white transition-all hover:border-cobalt hover:bg-cobalt"
				>
					Next →
				</LinkWithChannel>
			) : (
				<div
					aria-disabled="true"
					className="inline-flex h-12 min-w-[120px] cursor-not-allowed select-none items-center justify-center border border-gray-100 bg-gray-50 px-6 text-xs font-bold uppercase tracking-widest text-gray-300"
				>
					Next →
				</div>
			)}
		</nav>
	);
}
