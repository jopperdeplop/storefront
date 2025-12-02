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

// 🗺️ FIX: Map codes to full names to prevent "IT" -> "Information Technology" confusion
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
	apiVersion: "v1beta",
});

// --- GRAPHQL QUERIES ---
const GET_CATEGORIES = `
  query GetCategories($cursor: String) {
    categories(first: 20, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          description
          seoTitle
          seoDescription
          parent {
            name
          }
        }
      }
    }
  }
`;

const GET_COLLECTIONS = `
  query GetCollections($cursor: String) {
    collections(first: 20, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          name
          description
          seoTitle
          seoDescription
        }
      }
    }
  }
`;

const TRANSLATE_CATEGORY = `
  mutation TranslateCategory($id: ID!, $input: TranslationInput!, $lang: LanguageCodeEnum!) {
    categoryTranslate(id: $id, input: $input, languageCode: $lang) {
      errors { field message }
    }
  }
`;

const TRANSLATE_COLLECTION = `
  mutation TranslateCollection($id: ID!, $input: TranslationInput!, $lang: LanguageCodeEnum!) {
    collectionTranslate(id: $id, input: $input, languageCode: $lang) {
      errors { field message }
    }
  }
`;

// --- HELPERS ---

function prepareContent(item) {
	let blocks = [];
	try {
		const rawDesc = JSON.parse(item.description);
		if (rawDesc && Array.isArray(rawDesc.blocks)) {
			blocks = rawDesc.blocks;
		}
	} catch (e) {}

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
			name: item.name || "",
			seoTitle: item.seoTitle || "",
			seoDescription: item.seoDescription || "",
			descriptionTexts: blockTexts,
		},
		parentName: item.parent?.name || null,
		originalBlocks: blocks,
		textBlockIndices: textBlocks.map((b) => b.originalIndex),
	};
}

function reconstructDescription(originalBlocks, textBlockIndices, translatedTexts) {
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
async function processLanguage(
	item,
	type,
	mutationQuery,
	payload,
	parentName,
	originalBlocks,
	textBlockIndices,
	lang,
) {
	try {
		const contextStr = parentName
			? `CONTEXT: This is a subcategory of "${parentName}". Translate accordingly.`
			: "CONTEXT: Top-level category.";

		// ✅ FIX: Use the full language name (e.g., "Italian") instead of code ("IT")
		const targetLanguageName = LANGUAGE_NAMES[lang] || lang;

		const prompt = `
            Translate e-commerce content to ${targetLanguageName} (${lang}).
            ${contextStr}
            
            Fields: name, seoTitle, seoDescription, descriptionTexts.
            CONSTRAINTS:
            1. seoTitle < 70 chars.
            2. seoDescription < 300 chars.
            3. Keep HTML tags. 
            4. Return JSON only.
            
            Input: ${JSON.stringify(payload)}
        `;

		const result = await generateWithRetry(prompt);
		const translatedData = JSON.parse(result.response.text());

		// Safety Truncation
		if (translatedData.seoTitle && translatedData.seoTitle.length > 70) {
			translatedData.seoTitle = translatedData.seoTitle.substring(0, 67) + "...";
		}
		if (translatedData.seoDescription && translatedData.seoDescription.length > 300) {
			translatedData.seoDescription = translatedData.seoDescription.substring(0, 297) + "...";
		}

		let finalDescription = null;
		if (originalBlocks.length > 0 && translatedData.descriptionTexts) {
			finalDescription = reconstructDescription(
				originalBlocks,
				textBlockIndices,
				translatedData.descriptionTexts,
			);
		}

		const mutation = await saleor
			.mutation(mutationQuery, {
				id: item.id,
				lang: lang,
				input: {
					name: translatedData.name,
					description: finalDescription,
					seoTitle: translatedData.seoTitle,
					seoDescription: translatedData.seoDescription,
				},
			})
			.toPromise();

		const errorField = type === "Category" ? "categoryTranslate" : "collectionTranslate";
		if (mutation.data?.[errorField]?.errors?.length > 0) {
			console.error(`   ❌ [${lang}] Saleor Error:`, mutation.data[errorField].errors[0].message);
		} else {
			// Success
		}
	} catch (e) {
		console.error(`   ⚠️ [${lang}] Failed: ${e.message.slice(0, 40)}...`);
	}
}

// --- MAIN LOOP ---
async function run() {
	console.log(
		`🚀 Starting Turbo Category & Collection Translation (${TARGET_LANGUAGES.length} langs/item)...`,
	);

	// 1. Process Categories
	console.log("\n--- PART 1: CATEGORIES ---");
	let hasNext = true;
	let cursor = null;
	let processedCount = 0;

	while (hasNext) {
		const result = await saleor.query(GET_CATEGORIES, { cursor }).toPromise();
		const items = result.data?.categories?.edges.map((e) => e.node) || [];

		if (items.length === 0) break;

		// Process in batches of 5
		const chunkedItems = [];
		for (let i = 0; i < items.length; i += 5) {
			chunkedItems.push(items.slice(i, i + 5));
		}

		for (const batch of chunkedItems) {
			await Promise.all(
				batch.map(async (item) => {
					const { payload, parentName, originalBlocks, textBlockIndices } = prepareContent(item);
					if (!payload.name) return;

					console.log(`⚡ Processing Category: ${item.name} ${parentName ? `(Child of ${parentName})` : ""}`);

					await Promise.all(
						TARGET_LANGUAGES.map((lang) =>
							processLanguage(
								item,
								"Category",
								TRANSLATE_CATEGORY,
								payload,
								parentName,
								originalBlocks,
								textBlockIndices,
								lang,
							),
						),
					);
					console.log(`   ✅ Finished: ${item.name}`);
				}),
			);
			processedCount += batch.length;
		}

		hasNext = result.data.categories.pageInfo.hasNextPage;
		cursor = result.data.categories.pageInfo.endCursor;
	}

	// 2. Process Collections
	console.log("\n--- PART 2: COLLECTIONS ---");
	hasNext = true;
	cursor = null;

	while (hasNext) {
		const result = await saleor.query(GET_COLLECTIONS, { cursor }).toPromise();
		const items = result.data?.collections?.edges.map((e) => e.node) || [];

		if (items.length === 0) break;

		const chunkedItems = [];
		for (let i = 0; i < items.length; i += 5) {
			chunkedItems.push(items.slice(i, i + 5));
		}

		for (const batch of chunkedItems) {
			await Promise.all(
				batch.map(async (item) => {
					const { payload, parentName, originalBlocks, textBlockIndices } = prepareContent(item);
					if (!payload.name) return;

					console.log(`⚡ Processing Collection: ${item.name}`);

					await Promise.all(
						TARGET_LANGUAGES.map((lang) =>
							processLanguage(
								item,
								"Collection",
								TRANSLATE_COLLECTION,
								payload,
								parentName,
								originalBlocks,
								textBlockIndices,
								lang,
							),
						),
					);
					console.log(`   ✅ Finished: ${item.name}`);
				}),
			);
			processedCount += batch.length;
		}

		hasNext = result.data.collections.pageInfo.hasNextPage;
		cursor = result.data.collections.pageInfo.endCursor;
	}

	console.log(`\n🎉 All Done! Processed ${processedCount} items.`);
}

run();
