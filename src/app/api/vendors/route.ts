import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Edge API Proxy for vendor location data.
 * This proxy handles authentication with the SaleorPortal public API using the internal secret
 * and implements 1-hour caching to ensure high performance for the 3D map.
 */
export async function GET() {
	const apiUrl = process.env.NEXT_PUBLIC_MAP_API_URL;
	const secret = process.env.INTERNAL_API_SECRET;

	// Validate environment setup
	if (!apiUrl || !secret) {
		console.error("[Proxy] Critical environmental variables missing.", {
			apiUrl: !!apiUrl,
			secret: !!secret,
		});
		return NextResponse.json({ error: "Configuration error on server" }, { status: 500 });
	}

	console.log("[Proxy] Fetching from:", apiUrl);

	try {
		const response = await fetch(apiUrl, {
			headers: {
				"x-internal-secret": secret,
				"Content-Type": "application/json",
			},
			// Disable caching to bust stale empty response
			cache: "no-store",
		});

		console.log("[Proxy] Response status:", response.status, response.statusText);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error(`[Proxy] SaleorPortal API error: ${response.status}`, errorBody);
			return NextResponse.json(
				{ error: "Upstream data fetch failed", details: errorBody },
				{ status: response.status },
			);
		}

		const data = await response.json();
		const vendors = Array.isArray(data) ? data : [];
		console.log(`[Proxy] Received ${vendors.length} vendors. Sample:`, JSON.stringify(vendors.slice(0, 2)));

		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		});
	} catch (error) {
		console.error("Failed to proxy vendor data request:", error);
		return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
	}
}
