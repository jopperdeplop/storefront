"use client";

import dynamic from "next/dynamic";

/**
 * Client-side component that handles the dynamic import of the MapLibre engine.
 * Next.js 15+ requires ssr:false to be called within a Client Component when using the App Router.
 */
const MapWrapper = dynamic(() => import("./MapWrapper"), {
	ssr: false,
	loading: () => (
		<div className="flex h-[75vh] min-h-[500px] w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-stone-200 bg-stone-100">
			<div className="mb-4 size-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
			<div className="font-bold tracking-tight text-stone-400">Initializing 3D Map Engine...</div>
		</div>
	),
});

export function MapClient() {
	return <MapWrapper />;
}
