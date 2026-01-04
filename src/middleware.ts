import { type NextRequest, NextResponse } from "next/server";

const CHANNEL_CONFIG: Record<string, string[]> = {
	austria: ["de", "en"],
	belgium: ["nl", "fr", "de", "en"],
	croatia: ["hr", "en"],
	cyprus: ["el", "en"],
	estonia: ["et", "en"],
	finland: ["fi", "en"],
	france: ["fr", "en"],
	germany: ["de", "en"],
	greece: ["el", "en"],
	ireland: ["en"],
	italy: ["it", "en"],
	latvia: ["lv", "en"],
	lithuania: ["lt", "en"],
	luxembourg: ["fr", "de", "en"],
	malta: ["mt", "en"],
	netherlands: ["nl", "en"],
	portugal: ["pt", "en"],
	slovakia: ["sk", "en"],
	slovenia: ["sl", "en"],
	spain: ["es", "en"],
	"default-channel": ["en"],
};

const COUNTRY_TO_CHANNEL: Record<string, string> = {
	AT: "austria",
	BE: "belgium",
	HR: "croatia",
	CY: "cyprus",
	EE: "estonia",
	FI: "finland",
	FR: "france",
	DE: "germany",
	GR: "greece",
	IE: "ireland",
	IT: "italy",
	LV: "latvia",
	LT: "lithuania",
	LU: "luxembourg",
	MT: "malta",
	NL: "netherlands",
	PT: "portugal",
	SK: "slovakia",
	SI: "slovenia",
	ES: "spain",
};

const DEFAULT_LOCALE = "en";
const DEFAULT_CHANNEL = "netherlands"; // Sensible fallback for EUR

/**
 * Gets the best matching locale from the Accept-Language header,
 * cookie, or defaults.
 */
const getPreferredLocale = (request: NextRequest, allowedLocales: string[]): string => {
	// 1. Check Cookie first (user choice)
	const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
	if (cookieLocale && allowedLocales.includes(cookieLocale)) {
		return cookieLocale;
	}

	// 2. Check Accept-Language header
	const acceptLanguage = request.headers.get("accept-language");
	if (acceptLanguage) {
		const userPreferred = acceptLanguage
			.split(",")
			.map((lang) => lang.trim().split(";")[0].split("-")[0])
			.filter(Boolean);

		const bestMatch = userPreferred.find((lang) => allowedLocales.includes(lang));
		if (bestMatch) return bestMatch;
	}

	return allowedLocales[0] || DEFAULT_LOCALE;
};

/**
 * Detects the user's country from Vercel headers or fallback.
 */
const detectChannel = (request: NextRequest): string => {
	const countryCode = request.headers.get("x-vercel-ip-country");
	if (countryCode && COUNTRY_TO_CHANNEL[countryCode]) {
		return COUNTRY_TO_CHANNEL[countryCode];
	}
	return DEFAULT_CHANNEL;
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
	const currentChannel = segments[0];
	const currentLocale = segments[1];

	// 3. SEO Legacy Redirects (/eur/* -> /netherlands/*)
	if (currentChannel === "eur") {
		const url = request.nextUrl.clone();
		const rest = segments.slice(1).join("/");
		url.pathname = `/${DEFAULT_CHANNEL}/${rest}`;
		return NextResponse.redirect(url, 301);
	}

	// 4. Channel Validation & Geo-Detection
	const validChannels = Object.keys(CHANNEL_CONFIG);
	if (!validChannels.includes(currentChannel)) {
		const detectedChannel = detectChannel(request);
		const allowedLocales = CHANNEL_CONFIG[detectedChannel];
		const preferredLocale = getPreferredLocale(request, allowedLocales);

		const url = request.nextUrl.clone();
		url.pathname = `/${detectedChannel}/${preferredLocale}${pathname}`;
		return NextResponse.redirect(url);
	}

	// 5. Locale Validation
	const allowedLocales = CHANNEL_CONFIG[currentChannel];
	if (!currentLocale || !allowedLocales.includes(currentLocale)) {
		const preferredLocale = getPreferredLocale(request, allowedLocales);
		const url = request.nextUrl.clone();

		const isInvalidLocale = currentLocale && currentLocale.length === 2;
		const restOfPath = isInvalidLocale ? segments.slice(2).join("/") : segments.slice(1).join("/");

		url.pathname = `/${currentChannel}/${preferredLocale}/${restOfPath ? "/" + restOfPath : ""}`;
		return NextResponse.redirect(url);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
