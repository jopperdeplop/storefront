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
		console.error("Critical environmental variables missing for vendor map integration.");
		return NextResponse.json({ error: "Configuration error on server" }, { status: 500 });
	}

	try {
		const response = await fetch(apiUrl, {
			headers: {
				"x-internal-secret": secret,
				"Content-Type": "application/json",
			},
			// Edge caching strategy: 1 hour revalidation
			next: {
				revalidate: 3600,
				tags: ["vendors-map"],
			},
		});

		if (!response.ok) {
			console.error(`SaleorPortal API error: ${response.status}`);
			return NextResponse.json({ error: "Upstream data fetch failed" }, { status: response.status });
		}

		const data = await response.json();

		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
			},
		});
	} catch (error) {
		console.error("Failed to proxy vendor data request:", error);
		return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
	}
}
