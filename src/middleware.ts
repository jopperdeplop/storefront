import { type NextRequest, NextResponse } from "next/server";

const CHANNEL_CONFIG = {
	eur: ["en", "nl", "de"], // Eurozone supports EN, NL, DE
	"default-channel": ["en"], // Global supports only EN
};

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// 1. Ignore Next internal files and static assets
	// NOTE: The 'api' path exclusion is now handled exclusively by the 'matcher' config below.
	if (
		pathname.startsWith("/_next") ||
		pathname.includes(".") // images, etc.
	) {
		return NextResponse.next();
	}

	// 2. Parse URL segments
	const segments = pathname.split("/").filter(Boolean);
	const currentChannel = segments[0]; // 'eur' or 'default-channel'
	const currentLocale = segments[1]; // 'nl', 'de', etc.

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
		const restOfPath = allowedLocales.includes(currentLocale)
			? segments.slice(2).join("/")
			: segments.slice(1).join("/");

		url.pathname = `/${currentChannel}/${defaultLocale}/${restOfPath}`;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	// This ensures the middleware runs on ALL paths except those explicitly excluded (like /api/*)
	// This configuration is robust for handling API route exclusions.
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
