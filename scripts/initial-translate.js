const { createClient } = require("@urql/core");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

const TARGET_LANGUAGES = ["NL", "DE"]; // Add your target languages here

const saleor = createClient({
	url: process.env.NEXT_PUBLIC_SALEOR_API_URL,
	fetchOptions: { headers: { Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}` } },
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// QUERIES
const GET_PRODUCTS = `
  query GetProducts($cursor: String) {
    products(first: 20, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      edges { node { id name description seoTitle seoDescription } }
    }
  }
`;

const TRANSLATE_MUTATION = `
  mutation TranslateProduct($id: ID!, $input: TranslationInput!, $lang: LanguageCodeEnum!) {
    productTranslate(id: $id, input: $input, languageCode: $lang) {
      errors { field message }
    }
  }
`;

async function run() {
	console.log("🚀 Starting Bulk Translation...");
	let hasNext = true;
	let cursor = null;

	while (hasNext) {
		const { data } = await saleor.query(GET_PRODUCTS, { cursor }).toPromise();
		if (!data) break;

		const products = data.products.edges.map((e) => e.node);

		for (const product of products) {
			console.log(`Processing: ${product.name}`);

			const content = {
				name: product.name,
				description: product.description,
				seoTitle: product.seoTitle,
				seoDescription: product.seoDescription,
			};

			for (const lang of TARGET_LANGUAGES) {
				try {
					const prompt = `Translate to ${lang}. Return JSON only. Input: ${JSON.stringify(content)}`;
					const result = await model.generateContent(prompt);
					const translatedInput = JSON.parse(result.response.text().replace(/^```json\n|```$/g, ""));

					await saleor
						.mutation(TRANSLATE_MUTATION, {
							id: product.id,
							input: translatedInput,
							lang: lang,
						})
						.toPromise();

					process.stdout.write(` [${lang} OK]`);
				} catch (e) {
					process.stdout.write(` [${lang} FAIL: ${e.message}]`);
				}
				await new Promise((r) => setTimeout(r, 1000)); // Rate limit safety
			}
			console.log("");
		}

		hasNext = data.products.pageInfo.hasNextPage;
		cursor = data.products.pageInfo.endCursor;
	}
}

run();
