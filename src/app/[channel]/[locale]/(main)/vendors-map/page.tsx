import dynamic from "next/dynamic";
import { type Metadata } from "next";

export const metadata: Metadata = {
	title: "Vendors Map | Salp Artisan Market",
	description: "Explore our network of verified European artisans and boutiques on our interactive 3D map.",
};

/**
 * Dynamically import the MapWrapper with SSR disabled.
 * This is required because maplibre-gl relies heavily on browser APIs (window, navigator, canvas).
 */
const MapWrapper = dynamic(() => import("@/ui/components/Map/MapWrapper"), {
	ssr: false,
	loading: () => (
		<div className="flex h-[75vh] min-h-[500px] w-full flex-col items-center justify-center rounded-[2.5rem] border-2 border-dashed border-stone-200 bg-stone-100">
			<div className="mb-4 size-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
			<div className="font-bold tracking-tight text-stone-400">Initializing 3D Map Engine...</div>
		</div>
	),
});

export default function VendorsMapPage() {
	return (
		<main className="min-h-screen bg-stone-50/50">
			<div className="container mx-auto px-4 py-20">
				{/* Header Section */}
				<div className="mx-auto mb-20 max-w-4xl text-center">
					<div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-600">
						<span className="relative flex size-2">
							<span className="absolute inline-flex size-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
							<span className="relative inline-flex size-2 rounded-full bg-indigo-600"></span>
						</span>
						Verified Network
					</div>
					<h1 className="mb-8 text-5xl font-black tracking-tight text-stone-900 md:text-7xl">
						Our European <span className="italic text-indigo-600">Makers</span>
					</h1>
					<p className="mx-auto max-w-2xl text-xl font-medium leading-relaxed text-stone-600">
						Salp connects you directly with independent artisans. Zoom into our 3D relief map to discover the
						unique origins of every product in our collection.
					</p>
				</div>

				{/* Map Section */}
				<div className="mx-auto max-w-7xl">
					<MapWrapper />
				</div>

				{/* Features / Legend Section */}
				<div className="mx-auto mt-24 grid max-w-7xl grid-cols-1 gap-16 border-t border-stone-200 py-20 md:grid-cols-3">
					<div className="space-y-4">
						<div className="flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
							</svg>
						</div>
						<h3 className="text-xl font-black text-stone-900">Topographic Detail</h3>
						<p className="font-medium leading-relaxed text-stone-500">
							Our map uses Terrain-RGB data to render real-world elevation. Experience the actual 3D landscape
							of our artisans&apos; homelands.
						</p>
					</div>
					<div className="space-y-4">
						<div className="flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
							</svg>
						</div>
						<h3 className="text-xl font-black text-stone-900">Verified Origin</h3>
						<p className="font-medium leading-relaxed text-stone-500">
							Every pin is a verified business location. We geocode every partner to ensure full transparency
							for your purchases.
						</p>
					</div>
					<div className="space-y-4">
						<div className="flex size-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm">
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
							>
								<rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
								<line x1="12" y1="18" x2="12.01" y2="18"></line>
							</svg>
						</div>
						<h3 className="text-xl font-black text-stone-900">Mobile Cooperative</h3>
						<p className="font-medium leading-relaxed text-stone-500">
							Navigate effortlessly. We&apos;ve implemented gesture controls to prevent the map from capturing
							your scroll on touch devices.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}
