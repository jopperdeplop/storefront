import { createClient, fetchExchange } from "@urql/core";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// --- CONFIGURATION ---
const TARGET_LANGUAGES = [
	"NL",
	"DE",
	"FR",
	"IT",
	"ES",
	"PT",
	"FI",
	"ET",
	"LV",
	"LT",
	"SK",
	"SL",
	"EL",
	"HR",
	"MT",
];

const LANGUAGE_NAMES = {
	NL: "Dutch",
	DE: "German",
	FR: "French",
	IT: "Italian",
	ES: "Spanish",
	PT: "Portuguese",
	FI: "Finnish",
	ET: "Estonian",
	LV: "Latvian",
	LT: "Lithuanian",
	SK: "Slovak",
	SL: "Slovenian",
	EL: "Greek",
	HR: "Croatian",
	MT: "Maltese",
};

const GEMINI_MODEL_NAME = "gemini-2.5-flash";

const SALEOR_API_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL;
const SALEOR_APP_TOKEN = process.env.SALEOR_APP_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SALEOR_API_URL || !SALEOR_APP_TOKEN || !GEMINI_API_KEY) {
	console.error("❌ Missing .env variables.");
	process.exit(1);
}

// --- CLIENTS ---
const saleor = createClient({
	url: SALEOR_API_URL,
	requestPolicy: "network-only",
	preferGetMethod: false,
	fetchOptions: {
		method: "POST",
		headers: { Authorization: `Bearer ${SALEOR_APP_TOKEN}` },
	},
	exchanges: [fetchExchange],
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
	model: GEMINI_MODEL_NAME,
	generationConfig: { responseMimeType: "application/json" },
});

// --- GRAPHQL QUERIES ---

// 1. Fetch Pages (Models)
const GET_PAGES = `
  query GetPages($cursor: String) {
    pages(first: 20, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          slug
          title
          content
          seoTitle
          seoDescription
        }
      }
    }
  }
`;

// 2. Translate Page Mutation
// ⚠️ FIX: Changed 'pageId' to 'id' to match Saleor Schema
const TRANSLATE_PAGE = `
  mutation TranslatePage($id: ID!, $input: PageTranslationInput!, $lang: LanguageCodeEnum!) {
    pageTranslate(id: $id, input: $input, languageCode: $lang) {
      errors { field message }
    }
  }
`;

// --- HELPERS ---

function prepareContent(item) {
	let blocks = [];
	try {
		const rawContent = JSON.parse(item.content);
		if (rawContent && Array.isArray(rawContent.blocks)) {
			blocks = rawContent.blocks;
		}
	} catch (e) {
		// Content might be null
	}

	const textBlocks = blocks
		.map((b, idx) => ({ ...b, originalIndex: idx }))
		.filter((b) => ["paragraph", "header", "list", "quote"].includes(b.type));

	const blockTexts = textBlocks.map((b) => {
		if (b.type === "list" && Array.isArray(b.data.items)) {
			return b.data.items.join("|||");
		}
		return b.data.text;
	});

	return {
		payload: {
			title: item.title || "",
			seoTitle: item.seoTitle || "",
			seoDescription: item.seoDescription || "",
			contentTexts: blockTexts,
		},
		slug: item.slug,
		originalBlocks: blocks,
		textBlockIndices: textBlocks.map((b) => b.originalIndex),
	};
}

function reconstructContent(originalBlocks, textBlockIndices, translatedTexts) {
	const newBlocks = JSON.parse(JSON.stringify(originalBlocks));

	translatedTexts.forEach((translatedText, i) => {
		const originalIndex = textBlockIndices[i];
		const block = newBlocks[originalIndex];

		if (block.type === "list") {
			block.data.items = translatedText.split("|||").map((s) => s.trim());
		} else {
			block.data.text = translatedText;
		}
	});

	return JSON.stringify({ time: Date.now(), blocks: newBlocks, version: "2.28.2" });
}

async function generateWithRetry(prompt, retries = 3) {
	try {
		return await model.generateContent(prompt);
	} catch (e) {
		if (e.message.includes("429") && retries > 0) {
			let waitTime = 5000;
			const match = e.message.match(/retry in ([0-9.]+)s/);
			if (match && match[1]) {
				waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
			}
			console.log(`   ⏳ Rate limit. Cooling down for ${Math.round(waitTime / 1000)}s...`);
			await new Promise((r) => setTimeout(r, waitTime));
			return generateWithRetry(prompt, retries - 1);
		}
		throw e;
	}
}

// --- WORKER FUNCTION ---
async function processLanguage(item, payload, originalBlocks, textBlockIndices, lang) {
	try {
		const targetLanguageName = LANGUAGE_NAMES[lang] || lang;

		let contextStr = "Translate content for an e-commerce store.";
		if (item.slug === "home-hero")
			contextStr += " CONTEXT: This is the MAIN HERO headline. Make it punchy, inspiring, and powerful.";
		if (item.slug === "home-spotlight")
			contextStr +=
				" CONTEXT: This is an editorial section about craftsmanship. Keep it sophisticated and elegant.";

		const prompt = `
            Task: Translate e-commerce content to ${targetLanguageName} (${lang}).
            ${contextStr}
            
            Fields to translate: title, seoTitle, seoDescription, contentTexts.
            
            CONSTRAINTS:
            1. seoTitle < 70 chars.
            2. seoDescription < 300 chars.
            3. contentTexts is an array of strings. Maintain HTML tags (<b>, <i>) if present.
            4. Return strictly valid JSON.
            
            Input JSON: ${JSON.stringify(payload)}
        `;

		const result = await generateWithRetry(prompt);
		const translatedData = JSON.parse(result.response.text());

		if (translatedData.seoTitle?.length > 70)
			translatedData.seoTitle = translatedData.seoTitle.substring(0, 67) + "...";
		if (translatedData.seoDescription?.length > 300)
			translatedData.seoDescription = translatedData.seoDescription.substring(0, 297) + "...";

		let finalContentJson = null;
		if (originalBlocks.length > 0 && translatedData.contentTexts) {
			finalContentJson = reconstructContent(originalBlocks, textBlockIndices, translatedData.contentTexts);
		}

		const mutation = await saleor
			.mutation(TRANSLATE_PAGE, {
				id: item.id, // Correct argument for mutation
				lang: lang,
				input: {
					title: translatedData.title,
					content: finalContentJson,
					seoTitle: translatedData.seoTitle,
					seoDescription: translatedData.seoDescription,
				},
			})
			.toPromise();

		// ⚠️ NEW: Explicitly check for Schema Errors (Silent failures)
		if (mutation.error) {
			console.error(`   ❌ [${lang}] Schema/Network Error:`, mutation.error.message);
			return;
		}

		if (mutation.data?.pageTranslate?.errors?.length > 0) {
			console.error(`   ❌ [${lang}] Saleor Error:`, mutation.data.pageTranslate.errors[0].message);
		} else {
			// Success
		}
	} catch (e) {
		console.error(`   ⚠️ [${lang}] Failed: ${e.message.slice(0, 40)}...`);
	}
}

// --- MAIN RUNNER ---
async function run() {
	console.log(`🚀 Starting Page (Model) Translation (${TARGET_LANGUAGES.length} langs/page)...`);

	let hasNext = true;
	let cursor = null;
	let processedCount = 0;

	while (hasNext) {
		const result = await saleor.query(GET_PAGES, { cursor }).toPromise();

		if (result.error) {
			console.error("❌ Fatal Error Fetching Pages:", result.error);
			break;
		}

		const items = result.data?.pages?.edges.map((e) => e.node) || [];
		if (items.length === 0) break;

		const chunkedItems = [];
		for (let i = 0; i < items.length; i += 5) {
			chunkedItems.push(items.slice(i, i + 5));
		}

		for (const batch of chunkedItems) {
			await Promise.all(
				batch.map(async (item) => {
					const { payload, slug, originalBlocks, textBlockIndices } = prepareContent(item);

					if (!payload.title) return;

					console.log(`⚡ Processing Page: "${item.title}" (slug: ${slug})`);

					await Promise.all(
						TARGET_LANGUAGES.map((lang) =>
							processLanguage(item, payload, originalBlocks, textBlockIndices, lang),
						),
					);

					console.log(`   ✅ Finished: ${slug}`);
				}),
			);
			processedCount += batch.length;
		}

		hasNext = result.data.pages.pageInfo.hasNextPage;
		cursor = result.data.pages.pageInfo.endCursor;
	}

	console.log(`\n🎉 All Done! Processed ${processedCount} pages.`);
}

run();
