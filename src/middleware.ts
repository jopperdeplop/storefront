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

const DEFAULT_LOCALE = "en";
const DEFAULT_CHANNEL = "eur";

/**
 * Gets the best matching locale from the Accept-Language header that is supported
 * by the provided allowedLocales list. Falls back to DEFAULT_LOCALE.
 */
const getPreferredLocale = (request: NextRequest, allowedLocales: string[]): string => {
	const acceptLanguage = request.headers.get("accept-language");

	if (!acceptLanguage) {
		return DEFAULT_LOCALE;
	}

	// Parse the Accept-Language header (e.g., 'fr-CH, fr;q=0.9, en;q=0.8')
	// and find the best match in the allowed locales.
	const userPreferred = acceptLanguage
		.split(",")
		.map((lang) => lang.trim().split(";")[0].split("-")[0])
		.filter(Boolean);

	// Find the first preferred locale that is supported by the channel
	const bestMatch = userPreferred.find((lang) => allowedLocales.includes(lang));

	return bestMatch || DEFAULT_LOCALE;
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
		// --- MODIFIED LOGIC: Determine locale from headers and redirect to best match ---

		// 3.1. Determine the best locale for the desired default channel ('eur')
		const allowedLocalesForDefaultChannel = CHANNEL_CONFIG[DEFAULT_CHANNEL as keyof typeof CHANNEL_CONFIG];
		const preferredLocale = getPreferredLocale(request, allowedLocalesForDefaultChannel);

		// 3.2. Redirect to default channel/preferred locale if missing or invalid
		const url = request.nextUrl.clone();
		// Construct new path: /[DEFAULT_CHANNEL]/[preferredLocale]/[originalPath]
		url.pathname = `/${DEFAULT_CHANNEL}/${preferredLocale}${pathname}`;
		return NextResponse.redirect(url);
		// ----------------------------------------------------------------------------
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
