"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useParams } from "next/navigation";

interface Vendor {
	id: number;
	brandName: string;
	city: string;
	latitude: number;
	longitude: number;
	saleorPageSlug?: string;
	countryCode?: string;
}

export default function MapWrapper() {
	const params = useParams();
	const locale = params?.locale || "en-GB";
	const channel = params?.channel || "default-channel";

	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<maplibregl.Map | null>(null);
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Fetch vendors from the local proxy API
		const fetchVendors = async () => {
			try {
				const res = await fetch("/api/vendors");
				const data = await res.json();
				if (Array.isArray(data)) {
					setVendors(data);
				}
			} catch (err) {
				console.error("Failed to load vendor markers:", err);
			} finally {
				setLoading(false);
			}
		};
		fetchVendors();
	}, []);

	useEffect(() => {
		if (!mapContainer.current || map.current) return;

		const apiKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
		const styleUrl = process.env.NEXT_PUBLIC_MAPTILER_STYLE;

		// Initialize MapLibre GL
		map.current = new maplibregl.Map({
			container: mapContainer.current,
			style: styleUrl || `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${apiKey}`,
			center: [15.2551, 54.526], // Centered on Europe
			zoom: 3.8,
			pitch: 45,
			bearing: 0,
			antialias: true,
			cooperativeGestures: true, // Prevents scroll trapping on mobile
		});

		map.current.on("load", () => {
			if (!map.current) return;

			// Add 3D Terrain Source
			map.current.addSource("terrain", {
				type: "raster-dem",
				url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${apiKey}`,
				tileSize: 512,
			});

			// Enable Terrain with slight exaggeration for a cinematic feel
			map.current.setTerrain({ source: "terrain", exaggeration: 1.4 });

			// Add Sky/Atmosphere
			map.current.addLayer({
				id: "sky",
				type: "sky" as any,
				paint: {
					"sky-type": "atmosphere",
					"sky-atmosphere-sun": [0.0, 90.0],
					"sky-atmosphere-sun-intensity": 15,
				},
			});
		});

		// Add Navigation Controls
		map.current.addControl(
			new maplibregl.NavigationControl({
				showCompass: true,
				showZoom: true,
				visualizePitch: true,
			}),
			"bottom-right",
		);

		return () => {
			map.current?.remove();
			map.current = null;
		};
	}, []);

	// Sync markers when vendors data is loaded
	useEffect(() => {
		if (!map.current || vendors.length === 0) return;

		vendors.forEach((vendor) => {
			// Create a custom HTML element for the marker to allow styling and animations
			const el = document.createElement("div");
			el.className = "marker-container";
			el.innerHTML = `
                <div class="marker-pin group cursor-pointer">
                    <div class="marker-icon shadow-2xl">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                </div>
            `;

			// Setup the Popup
			const popup = new maplibregl.Popup({
				offset: 35,
				closeButton: false,
				maxWidth: "300px",
				className: "custom-vendor-popup",
			}).setHTML(`
                <div class="vendor-card">
                    <div class="vendor-header">
                        <span class="city-tag">${vendor.city}</span>
                        <h3 class="brand-name">${vendor.brandName}</h3>
                    </div>
                    ${
											vendor.saleorPageSlug
												? `
                        <div class="vendor-action">
                            <a href="/${locale}/${channel}/pages/${vendor.saleorPageSlug}" class="visit-btn">
                                Visit Shop
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
                            </a>
                        </div>
                    `
												: ""
										}
                </div>
            `);

			// Add the Marker to the map
			new maplibregl.Marker({ element: el, anchor: "bottom" })
				.setLngLat([vendor.longitude, vendor.latitude])
				.setPopup(popup)
				.addTo(map.current!);
		});
	}, [vendors, locale, channel]);

	return (
		<div className="group relative h-[75vh] min-h-[500px] w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-stone-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
			{/* The Map Container */}
			<div ref={mapContainer} className="absolute inset-0 z-0" />

			{/* Loading State Overlay */}
			{loading && (
				<div className="absolute inset-0 z-20 flex items-center justify-center bg-stone-900/40 backdrop-blur-xl">
					<div className="flex flex-col items-center gap-6">
						<div className="relative">
							<div className="size-16 rounded-full border-[3px] border-indigo-500/20" />
							<div className="absolute inset-0 size-16 animate-spin rounded-full border-[3px] border-indigo-400 border-t-transparent" />
						</div>
						<div className="text-center">
							<h4 className="text-lg font-bold tracking-tight text-white">Loading Europe</h4>
							<p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-200/60">
								Initializing 3D Terrain
							</p>
						</div>
					</div>
				</div>
			)}

			{/* UI Overlay: Info Panel */}
			<div className="pointer-events-none absolute left-8 top-8 z-10 max-w-[280px]">
				<div className="pointer-events-auto rounded-3xl border border-white bg-white/90 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.15)] backdrop-blur-2xl transition-all hover:scale-[1.02]">
					<div className="mb-4 flex items-center gap-3">
						<div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-200">
							<Globe className="size-5 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-black leading-tight tracking-tight text-indigo-950">Artisan Hub</h2>
							<p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
								Live Inventory Map
							</p>
						</div>
					</div>
					<div className="mb-4 h-px bg-gradient-to-r from-indigo-100 to-transparent" />
					<p className="text-xs font-medium leading-relaxed text-indigo-900/60">
						Explore our network of verified European vendors. Our map uses{" "}
						<span className="font-bold text-indigo-600">GPU-accelerated 3D terrain</span> to visualize the
						origin of your products.
					</p>
					<div className="mt-4 flex items-center gap-2">
						<span className="flex size-2 animate-pulse rounded-full bg-green-500" />
						<span className="text-[11px] font-bold text-indigo-900/40">
							{vendors.length} Shops Registered
						</span>
					</div>
				</div>
			</div>

			{/* Global Styles for Custom Markers and Popups */}
			<style jsx global>{`
				.marker-icon {
					width: 38px;
					height: 38px;
					background: #4f46e5;
					border: 3px solid white;
					border-radius: 50% 50% 50% 0;
					transform: rotate(-45deg);
					display: flex;
					align-items: center;
					justify-content: center;
					color: white;
					transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
				}
				.marker-icon svg {
					transform: rotate(45deg);
				}
				.marker-container:hover .marker-icon {
					background: #3730a3;
					transform: rotate(-45deg) scale(1.15) translateY(-5px);
					box-shadow: 0 20px 25px -5px rgba(79, 70, 229, 0.4);
				}

				.custom-vendor-popup .maplibregl-popup-content {
					background: white;
					border-radius: 1.5rem;
					padding: 0;
					box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
					border: none;
					overflow: hidden;
				}
				.custom-vendor-popup .maplibregl-popup-tip {
					display: none;
				}

				.vendor-card {
					padding: 1.5rem;
					min-width: 220px;
				}
				.city-tag {
					display: inline-block;
					padding: 0.25rem 0.6rem;
					background: #f5f3ff;
					color: #4f46e5;
					font-size: 10px;
					font-weight: 900;
					text-transform: uppercase;
					letter-spacing: 0.1em;
					border-radius: 2rem;
					margin-bottom: 0.5rem;
				}
				.brand-name {
					font-size: 1.25rem;
					font-weight: 800;
					color: #1e1b4b;
					margin: 0 0 1.25rem 0;
					letter-spacing: -0.02em;
				}
				.visit-btn {
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 0.5rem;
					width: 100%;
					padding: 0.75rem;
					background: #4f46e5;
					color: white;
					border-radius: 1rem;
					font-size: 0.875rem;
					font-weight: 700;
					text-decoration: none;
					transition: all 0.2s;
				}
				.visit-btn:hover {
					background: #4338ca;
					transform: translateY(-2px);
					box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.3);
				}
			`}</style>
		</div>
	);
}

// Minimal Globe icon since we can't easily import from lucide in the style tag scope or string templates
function Globe(props: any) {
	return (
		<svg
			{...props}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<circle cx="12" cy="12" r="10" />
			<line x1="2" y1="12" x2="22" y2="12" />
			<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
		</svg>
	);
}
