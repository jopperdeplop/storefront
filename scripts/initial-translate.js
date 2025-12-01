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

// 🏆 BEST CHOICE: 1.5 Flash is the fastest & most cost-effective for bulk text.
// It costs ~$0.075 per 1M input tokens (vs ~$0.30+ for 2.5), saving 75% on costs.
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
	// Critical for large bulk operations to prevent "413 Payload Too Large" or HTML errors
	requestPolicy: "network-only",
	preferGetMethod: false,
	fetchOptions: {
		method: "POST",
		headers: {
			Authorization: `Bearer ${SALEOR_APP_TOKEN}`,
		},
	},
	exchanges: [fetchExchange],
});

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
	model: GEMINI_MODEL_NAME,
	generationConfig: { responseMimeType: "application/json" },
	apiVersion: "v1beta",
});

// --- GRAPHQL ---
const GET_PRODUCTS = `
  query GetProducts($cursor: String) {
    products(first: 20, after: $cursor) {
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

const TRANSLATE_MUTATION = `
  mutation TranslateProduct($id: ID!, $input: TranslationInput!, $lang: LanguageCodeEnum!) {
    productTranslate(id: $id, input: $input, languageCode: $lang) {
      errors { field message }
      product {
        translation(languageCode: $lang) { name }
      }
    }
  }
`;

// --- HELPERS ---

function prepareContentForAI(product) {
	let blocks = [];
	try {
		const rawDesc = JSON.parse(product.description);
		if (rawDesc && Array.isArray(rawDesc.blocks)) {
			blocks = rawDesc.blocks;
		}
	} catch (e) {
		// Description might be empty or invalid
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
			name: product.name || "",
			// SEO Fields included here
			seoTitle: product.seoTitle || "",
			seoDescription: product.seoDescription || "",
			descriptionTexts: blockTexts,
		},
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
		const result = await model.generateContent(prompt);
		return result;
	} catch (e) {
		if (e.message.includes("429") && retries > 0) {
			let waitTime = 32000;
			const match = e.message.match(/retry in ([0-9.]+)s/);
			if (match && match[1]) {
				waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
			}

			console.log(`   ⏳ Rate limit hit. Cooling down for ${Math.round(waitTime / 1000)}s...`);
			await new Promise((r) => setTimeout(r, waitTime));
			return generateWithRetry(prompt, retries - 1);
		}
		throw e;
	}
}

// --- MAIN LOOP ---
async function run() {
	console.log(`🚀 Starting Bulk Translation using ${GEMINI_MODEL_NAME}...`);

	let hasNext = true;
	let cursor = null;
	let processedCount = 0;

	while (hasNext) {
		const result = await saleor.query(GET_PRODUCTS, { cursor }).toPromise();

		if (result.error) {
			console.error("❌ Saleor Query Error:", result.error.message);
			break;
		}

		const data = result.data;
		if (!data?.products?.edges || data.products.edges.length === 0) {
			console.log("No products found.");
			break;
		}

		const products = data.products.edges.map((e) => e.node);

		for (const product of products) {
			console.log(`\n📦 Processing: ${product.name} (${product.id})`);

			const { payload, originalBlocks, textBlockIndices } = prepareContentForAI(product);

			if (!payload.name && payload.descriptionTexts.length === 0) {
				console.log("   (Skipping - empty content)");
				continue;
			}

			for (const lang of TARGET_LANGUAGES) {
				try {
					// UPDATED PROMPT: Explicitly requests translation of SEO fields
					const prompt = `
                        You are a professional translator for a luxury e-commerce store.
                        Translate the following fields to ${lang}:
                        1. "name" (Product Title)
                        2. "seoTitle" (Search Engine Title - keep it concise)
                        3. "seoDescription" (Search Engine Description - compelling and click-worthy)
                        4. "descriptionTexts" (Content - keep HTML tags like <b>, <i> intact)

                        If a field is empty in the input, return it as an empty string "".
                        Do NOT translate keys. Return strictly valid JSON.
                        
                        Input JSON:
                        ${JSON.stringify(payload)}
                    `;

					const result = await generateWithRetry(prompt);
					const responseText = result.response.text();
					const translatedData = JSON.parse(responseText);

					let finalDescription = null;
					if (originalBlocks.length > 0 && translatedData.descriptionTexts) {
						finalDescription = reconstructDescription(
							originalBlocks,
							textBlockIndices,
							translatedData.descriptionTexts,
						);
					}

					const mutationResult = await saleor
						.mutation(TRANSLATE_MUTATION, {
							id: product.id,
							lang: lang,
							input: {
								name: translatedData.name,
								description: finalDescription,
								// Explicitly passing translated SEO fields
								seoTitle: translatedData.seoTitle,
								seoDescription: translatedData.seoDescription,
							},
						})
						.toPromise();

					if (mutationResult.data?.productTranslate?.errors?.length > 0) {
						console.error(`   ❌ [${lang}] Saleor Error:`, mutationResult.data.productTranslate.errors);
					} else {
						console.log(`   ✅ [${lang}] Success`);
					}
				} catch (e) {
					console.error(`   ⚠️ [${lang}] Failed: ${e.message}`);
				}

				await new Promise((r) => setTimeout(r, 500));
			}
			processedCount++;
		}

		hasNext = data.products.pageInfo.hasNextPage;
		cursor = data.products.pageInfo.endCursor;
	}
	console.log(`\n🎉 Done! Processed ${processedCount} products.`);
}

run();
