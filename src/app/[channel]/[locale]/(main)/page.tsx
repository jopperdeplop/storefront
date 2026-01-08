import {
	HomepageContentDocument,
	BrandPageTypeDocument,
	ProductListByCollectionDocument,
	type LanguageCodeEnum,
	type BrandPageTypeQuery,
} from "@/gql/graphql";
import { type Metadata } from "next";
import { executeGraphQL } from "@/lib/graphql";
import {
	HeroSection,
	NarrativeSection,
	BrandTickerSection,
	ProductGridSection,
	CollectionCardsSection,
} from "@/ui/components/payload";

export async function generateMetadata(props: {
	params: Promise<{ channel: string; locale: string }>;
}): Promise<Metadata> {
	const params = await props.params;
	const payloadHomepage = await getPayloadHomepage(params.locale);

	if (payloadHomepage?.seo) {
		return {
			title: payloadHomepage.seo.metaTitle || "Saleor Storefront",
			description: payloadHomepage.seo.metaDescription,
		};
	}

	return {
		title: "Saleor Storefront",
	};
}

// Types for Payload blocks
interface PayloadBlock {
	id?: string;
	blockType: string;
	[key: string]: unknown;
}

interface PayloadHomepage {
	id: string;
	layout: PayloadBlock[];
	seo?: {
		metaTitle?: string;
		metaDescription?: string;
	};
}

interface BrandNode {
	id: string;
	title: string;
	slug: string;
	logo?: { value?: { url?: string } };
}

interface ProductNode {
	id: string;
	slug: string;
	name: string;
	thumbnail?: { url: string; alt?: string | null } | null;
	category?: { name: string } | null;
	pricing?: {
		priceRange?: {
			start?: {
				gross: { amount: number; currency: string };
			};
		} | null;
	} | null;
	translation?: { name?: string } | null;
}

// Fetch homepage from PayloadCMS
async function getPayloadHomepage(locale: string): Promise<PayloadHomepage | null> {
	const payloadUrl = process.env.PAYLOAD_API_URL;
	if (!payloadUrl) {
		console.warn("PAYLOAD_API_URL not set, falling back to hardcoded content");
		return null;
	}

	try {
		const res = await fetch(`${payloadUrl}/api/homepage?locale=${locale}&depth=2`, {
			next: { revalidate: 60 },
		});
		if (!res.ok) return null;
		const data = (await res.json()) as any;
		return data.docs?.[0] || data;
	} catch (e) {
		console.error("Failed to fetch from Payload:", e);
		return null;
	}
}

// Fetch products by collection ID from Saleor
async function getProductsByCollection(
	collectionId: string,
	channel: string,
	locale: LanguageCodeEnum,
	max: number = 8,
): Promise<ProductNode[]> {
	if (!collectionId) return [];
	try {
		// Note: This uses the existing ProductListByCollection query
		// You may need to adjust based on your actual GraphQL setup
		const res = await executeGraphQL(ProductListByCollectionDocument, {
			variables: { slug: collectionId, channel, locale },
			revalidate: 60,
		});
		const products = (res as any)?.collection?.products?.edges?.map((e: any) => e.node) || [];
		return products.slice(0, max);
	} catch {
		return [];
	}
}

export default async function Page(props: { params: Promise<{ channel: string; locale: string }> }) {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	// Fetch PayloadCMS homepage
	const payloadHomepage = await getPayloadHomepage(params.locale);

	// Fetch brand logos from Saleor (still needed for brand ticker)
	const brandTypeRaw = await executeGraphQL(BrandPageTypeDocument, { revalidate: 600 });
	const brandTypeData = brandTypeRaw as unknown as BrandPageTypeQuery;
	const brandPageTypeId = brandTypeData.pageTypes?.edges?.[0]?.node.id;

	const rawData = await executeGraphQL(HomepageContentDocument, {
		variables: {
			channel: params.channel,
			locale: localeEnum,
			brandPageTypeId: brandPageTypeId ? [brandPageTypeId] : [],
		},
		revalidate: 60,
	});
	const saleorData = rawData as any;
	const brandItems: BrandNode[] = saleorData.brands?.edges?.map((e: any) => e.node) || [];

	// If Payload homepage exists, render blocks
	if (payloadHomepage && payloadHomepage.layout) {
		// Collect product grid blocks that need Saleor data
		const productGridBlocks = payloadHomepage.layout.filter(
			(b) => b.blockType === "product-grid" && b.saleorCollectionId,
		);

		// Fetch products for each grid
		const productsByBlock: Record<string, ProductNode[]> = {};
		for (const block of productGridBlocks) {
			const collectionId = block.saleorCollectionId as string;
			const max = (block.maxProducts as number) || 8;
			productsByBlock[block.id || collectionId] = await getProductsByCollection(
				collectionId,
				params.channel,
				localeEnum,
				max,
			);
		}

		return (
			<main className="min-h-screen bg-stone-50 text-gray-900 selection:bg-terracotta selection:text-white">
				{payloadHomepage.layout.map((block, idx) => {
					const key = block.id || `block-${idx}`;

					switch (block.blockType) {
						case "hero":
							return (
								<HeroSection key={key} data={block as any} channel={params.channel} locale={params.locale} />
							);

						case "narrative":
							return <NarrativeSection key={key} data={block as any} />;

						case "brand-ticker":
							return <BrandTickerSection key={key} data={block as any} brands={brandItems} />;

						case "product-grid":
							const products = productsByBlock[block.id || (block.saleorCollectionId as string)] || [];
							return (
								<ProductGridSection
									key={key}
									data={block as any}
									products={products}
									channel={params.channel}
									locale={params.locale}
								/>
							);

						case "collection-cards":
							return (
								<CollectionCardsSection
									key={key}
									data={block as any}
									channel={params.channel}
									locale={params.locale}
								/>
							);

						default:
							return null;
					}
				})}
			</main>
		);
	}

	// If Payload homepage is unavailable (e.g., first run or API down)
	return (
		<main className="flex min-h-[60vh] flex-col items-center justify-center bg-stone-50 p-6 text-center text-gray-900">
			<h1 className="font-serif text-4xl">Coming Soon</h1>
			<p className="mt-4 max-w-md text-gray-500">
				We are currently preparing our European curated collection. Please check back in a moment.
			</p>
		</main>
	);
}
