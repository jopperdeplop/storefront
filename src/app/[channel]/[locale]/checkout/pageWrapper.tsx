// src/app/[channel]/[locale]/checkout/pageWrapper.tsx
"use client";

import dynamic from "next/dynamic";
import { Loader } from "@/ui/atoms/Loader";

const Root = dynamic(() => import("@/checkout/Root").then((m) => m.Root), {
	ssr: false,
	loading: () => (
		<div className="flex min-h-dvh w-full items-center justify-center bg-white">
			<div className="flex flex-col items-center gap-4">
				<Loader />
				<p className="font-mono text-xs uppercase tracking-widest text-gray-500">
					Loading Secure Checkout...
				</p>
			</div>
		</div>
	),
});

export const RootWrapper = ({ saleorApiUrl }: { saleorApiUrl: string }) => {
	if (!saleorApiUrl) return null;
	return <Root saleorApiUrl={saleorApiUrl} />;
};
