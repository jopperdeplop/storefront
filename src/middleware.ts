import { type NextRequest, NextResponse } from "next/server";

const CHANNEL_CONFIG = {
	// Eurozone Channel: Supports languages for all 20 Eurozone countries
	eur: [
		"en", // Ireland, Malta (English)
		"nl", // Netherlands, Belgium (Dutch)
		"de", // Germany, Austria, Belgium, Luxembourg (German)
		"fr", // France, Belgium, Luxembourg (French)
		"it", // Italy (Italian)
		"es", // Spain (Spanish)
		"pt", // Portugal (Portuguese)
		"fi", // Finland (Finnish)
		"et", // Estonia (Estonian)
		"lv", // Latvia (Latvian)
		"lt", // Lithuania (Lithuanian)
		"sk", // Slovakia (Slovak)
		"sl", // Slovenia (Slovenian)
		"el", // Greece, Cyprus (Greek)
		"hr", // Croatia (Croatian)
		"mt", // Malta (Maltese)
	],
	"default-channel": ["en"], // Global fallback
};

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 1. Ignore Next internal files and static assets
	if (
		pathname.startsWith("/_next") ||
		pathname.includes(".") // images, etc.
	) {
		return NextResponse.next();
	}

	// 2. Parse URL segments
	const segments = pathname.split("/").filter(Boolean);
	const currentChannel = segments[0]; // 'eur' or 'default-channel'
	const currentLocale = segments[1]; // 'nl', 'de', 'fr', etc.

	// 3. Channel Validation
	const validChannels = Object.keys(CHANNEL_CONFIG);
	if (!validChannels.includes(currentChannel)) {
		// Redirect to default channel if missing or invalid
		const url = request.nextUrl.clone();
		url.pathname = `/eur/en${pathname}`;
		return NextResponse.redirect(url);
	}

	// 4. Locale Validation
	const allowedLocales = CHANNEL_CONFIG[currentChannel as keyof typeof CHANNEL_CONFIG];

	// If locale is missing or invalid for this channel, redirect to default (first allowed)
	if (!currentLocale || !allowedLocales.includes(currentLocale)) {
		const defaultLocale = allowedLocales[0];
		const url = request.nextUrl.clone();

		// Construct new path: /[channel]/[defaultLocale]/[rest...]
		// Only strip the invalid locale if it was actually a 2-letter code (avoids eating part of the path)
		const isInvalidLocale = currentLocale && currentLocale.length === 2;

		const restOfPath = isInvalidLocale ? segments.slice(2).join("/") : segments.slice(1).join("/");

		url.pathname = `/${currentChannel}/${defaultLocale}/${restOfPath ? "/" + restOfPath : ""}`;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
