import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, fetchExchange, cacheExchange } from "@urql/core";

// --- TYPE DEFINITIONS ---
interface TranslationContent {
	name?: string;
	description?: string;
	seoTitle?: string;
	seoDescription?: string;
	title?: string;
	content?: string;
}

interface WebhookEvent {
	event?: string;
	__typename?: string;
	product?: {
		id: string;
		name: string;
		description: string;
		seoTitle: string;
		seoDescription: string;
		privateMetadata: Array<{ key: string; value: string }>;
	};
	page?: {
		id: string;
		title: string;
		content: string;
		seoTitle: string;
		seoDescription: string;
	};
}

// --- CONFIG ---
export const maxDuration = 300; // 5 Minutes
export const dynamic = "force-dynamic";
const TARGET_LANGUAGES = ["NL", "DE"]; // Add your languages here

// --- ENVIRONMENT CHECKS ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL;
const SALEOR_APP_TOKEN = process.env.SALEOR_APP_TOKEN;

if (!GEMINI_API_KEY || !SALEOR_API_URL || !SALEOR_APP_TOKEN) {
	throw new Error(
		"Missing Environment Variables: Ensure GEMINI_API_KEY, NEXT_PUBLIC_SALEOR_API_URL, and SALEOR_APP_TOKEN are set.",
	);
}

// --- CLIENT INITIALIZATION ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const saleor = createClient({
	url: SALEOR_API_URL,
	exchanges: [cacheExchange, fetchExchange],
	fetchOptions: { headers: { Authorization: `Bearer ${SALEOR_APP_TOKEN}` } },
});

const MUTATIONS = {
	Product: `mutation($id: ID!, $input: TranslationInput!, $lang: LanguageCodeEnum!) {
    productTranslate(id: $id, input: $input, languageCode: $lang) { errors { field message } }
  }`,
	Page: `mutation($id: ID!, $input: PageTranslationInput!, $lang: LanguageCodeEnum!) {
    pageTranslate(id: $id, input: $input, languageCode: $lang) { errors { field message } }
  }`,
};

export async function POST(req: NextRequest) {
	// 1. Safe Event Parsing
	const event = (await req.json()) as WebhookEvent;

	// Normalize event type
	const type = event.event || event.__typename;
	console.log(`[Worker] Processing ${type}`);

	let entityId: string | undefined;
	let content: TranslationContent | undefined;
	let mutationType: "Product" | "Page" | undefined;

	// 2. EXTRACT CONTENT
	if (type === "ProductCreated" || type === "ProductUpdated") {
		if (!event.product) return NextResponse.json({ error: "No product data" });

		entityId = event.product.id;

		// Check for Bulk Import Flag
		const skip = event.product.privateMetadata?.find((m) => m.key === "skip_auto_translation");
		if (skip?.value === "true") return NextResponse.json({ skipped: "Bulk Import Flag" });

		content = {
			name: event.product.name,
			description: event.product.description,
			seoTitle: event.product.seoTitle,
			seoDescription: event.product.seoDescription,
		};
		mutationType = "Product";
	} else if (type === "PageCreated" || type === "PageUpdated") {
		if (!event.page) return NextResponse.json({ error: "No page data" });

		entityId = event.page.id;
		content = {
			title: event.page.title,
			content: event.page.content,
			seoTitle: event.page.seoTitle,
			seoDescription: event.page.seoDescription,
		};
		mutationType = "Page";
	}

	if (!entityId || !content || !mutationType) return NextResponse.json({ skipped: true });

	// 3. TRANSLATE LOOP
	for (const lang of TARGET_LANGUAGES) {
		try {
			const prompt = `
        Translate JSON values to ${lang}. 
        Return ONLY valid JSON. 
        Preserve structure. 
        Do not translate keys.
        Input: ${JSON.stringify(content)}
      `;

			const aiRes = await model.generateContent(prompt);
			const text = aiRes.response.text().replace(/^```json\n|```$/g, "");
			const translatedData = JSON.parse(text);

			await saleor
				.mutation(MUTATIONS[mutationType], {
					id: entityId,
					input: translatedData,
					lang: lang,
				})
				.toPromise();

			console.log(`Saved ${lang} translation for ${entityId}`);
		} catch (e) {
			console.error(`Failed ${lang}:`, e);
		}
	}

	return NextResponse.json({ success: true });
}
