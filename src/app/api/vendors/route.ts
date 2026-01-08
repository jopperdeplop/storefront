import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Edge API Proxy for vendor location data.
 * This proxy handles authentication with the SaleorPortal public API
 * and implements caching to ensure high performance for the 3D map.
 */
export async function GET() {
	const apiUrl = process.env.NEXT_PUBLIC_MAP_API_URL;
	const secret = process.env.INTERNAL_API_SECRET;

	if (!apiUrl || !secret) {
		return NextResponse.json({ error: "Configuration error" }, { status: 500 });
	}

	try {
		const response = await fetch(apiUrl, {
			headers: {
				"x-internal-secret": secret,
				"Content-Type": "application/json",
			},
			cache: "no-store",
		});

		if (!response.ok) {
			console.error("Vendor API error:", response.status, await response.text());
			return NextResponse.json({ error: "Upstream fetch failed" }, { status: response.status });
		}

		const data = await response.json();
		console.log("Vendor fetch success:", Array.isArray(data) ? data.length : "not array");

		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Vendor proxy error:", error);
		return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
	}
}
