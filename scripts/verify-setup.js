import dotenv from "dotenv";
// Note: Assuming 'node-fetch' is installed since you imported it previously.
import fetch from "node-fetch";

dotenv.config({ path: ".env.local" });

const SALEOR_URL = process.env.NEXT_PUBLIC_SALEOR_API_URL;
const TOKEN = process.env.SALEOR_APP_TOKEN;
const LOCAL_WEBHOOK_URL = "http://localhost:3000/api/webhooks/translate";

async function runChecks() {
	console.log("🔍 Starting Verification...\n");

	// --- CHECK 1: Permissions (MANAGE_CHANNELS) ---
	console.log("1️⃣  Checking Saleor App Token Permissions...");

	if (!SALEOR_URL || !TOKEN) {
		console.error("❌ Missing env variables. Check .env.local");
		return;
	}

	try {
		const response = await fetch(SALEOR_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${TOKEN}`,
			},
			body: JSON.stringify({
				query: `query { channels { slug currencyCode } }`,
			}),
		});

		const data = await response.json();

		if (data.errors) {
			console.error("❌ Permission Denied:", data.errors[0].message);
			console.log(
				"👉 FIX: Go to Saleor Dashboard > Apps > Translation Worker > Permissions and check 'MANAGE_CHANNELS'.",
			);
		} else {
			console.log("✅ Success! Token works and has MANAGE_CHANNELS permission.");
			console.log(`   Found ${data.data.channels.length} channels.`);
		}
	} catch (e) {
		console.error("❌ Network Error connecting to Saleor:", e.message);
	}

	console.log("\n---------------------------------------------------\n");

	// --- CHECK 2: Local Webhook Endpoint ---
	console.log("2️⃣  Simulating Webhook to Localhost...");

	try {
		const mockEvent = {
			event: "ProductCreated",
			product: {
				id: "TestProduct:123",
				name: "Test Verification Product",
				description: '{"blocks":[{"type":"paragraph","data":{"text":"This is a test."}}]}',
				seoTitle: "Test SEO",
				seoDescription: "Test Desc",
				privateMetadata: [],
			},
		};

		const webhookRes = await fetch(LOCAL_WEBHOOK_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(mockEvent),
		});

		// Check Content Type before parsing
		const contentType = webhookRes.headers.get("content-type");

		if (webhookRes.status === 200 && contentType && contentType.indexOf("application/json") !== -1) {
			const webhookData = await webhookRes.json();
			console.log("✅ Local Endpoint is reachable (200 OK).");
			console.log("   Response:", webhookData);
			console.log("👉 Check 'pnpm dev' terminal for '[Worker] Processing ProductCreated' log.");
		} else {
			const text = await webhookRes.text();
			console.error(`❌ Endpoint returned non-JSON response (${webhookRes.status}).`);
			console.error("   Response Preview:", text.substring(0, 200));

			if (webhookRes.status === 404) {
				console.log(
					"👉 FIX: Ensure src/app/api/webhooks/translate/route.ts exists and 'pnpm dev' is running.",
				);
			} else {
				// Likely a 500 or other server error, check pnpm dev terminal for stack trace
				console.log("👉 FIX: Check your 'pnpm dev' terminal for the full server stack trace!");
			}
		}
	} catch (e) {
		console.error("❌ Could not connect to localhost:", e.message);
		console.log("👉 Make sure 'pnpm dev' is running in another terminal!");
	}
}

runChecks();
