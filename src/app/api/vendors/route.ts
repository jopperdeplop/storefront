import { NextResponse } from "next/server";

export const runtime = "edge";

/**
 * Edge API Proxy for vendor location data.
 * Authenticates with the SaleorPortal and passes through the cached response.
 * Note: SaleorPortal handles caching (5 min), so we use no-store here to avoid stale data.
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
			cache: "no-store", // SaleorPortal handles caching
		});

		if (!response.ok) {
			return NextResponse.json({ error: "Upstream fetch failed" }, { status: response.status });
		}

		const data = await response.json();

		return NextResponse.json(data);
	} catch (error) {
		console.error("Vendor proxy error:", error);
		return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
	}
}
