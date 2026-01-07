import Link from "next/link";
import Image from "next/image";
import {
	HomepageContentDocument,
	BrandPageTypeDocument,
	ProductListByCollectionDocument,
	type LanguageCodeEnum,
	type BrandPageTypeQuery,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import {
	HeroSection,
	NarrativeSection,
	BrandTickerSection,
	ProductGridSection,
	CollectionCardsSection,
} from "@/ui/components/payload";

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
	logo?: { value?: { url?: string } } | null;
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
		const data = await res.json();
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

	// Fallback: Original hardcoded content (unchanged from before)
	// This ensures the page still works even if Payload is not configured
	return (
		<main className="min-h-screen bg-stone-50 text-gray-900 selection:bg-terracotta selection:text-white">
			<section className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-900 text-white">
				<div className="absolute inset-0 opacity-70">
					<Image
						src="https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2500"
						alt="European Craftsmanship"
						fill
						className="object-cover"
						priority
						fetchPriority="high"
					/>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
				<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
					<span className="mb-6 rounded-full border border-white/30 bg-white/10 px-4 py-1 font-mono text-xs font-medium uppercase tracking-[0.2em] backdrop-blur-md">
						Verified European Origin
					</span>
					<h1 className="max-w-5xl font-serif text-6xl font-medium leading-tight tracking-tight md:text-8xl lg:text-9xl">
						The European Standard.
					</h1>
					<p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-gray-100 md:text-xl">
						A gated community of verified European makers. No middlemen. No compromise on quality. Just
						improved margins for creators.
					</p>
					<div className="mt-10 flex flex-col gap-4 sm:flex-row">
						<Link
							href={`/${params.channel}/${params.locale}/products`}
							className="group relative overflow-hidden rounded-full bg-terracotta px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-terracotta-dark"
						>
							<span className="relative z-10">Explore the Collection</span>
						</Link>
						<Link
							href="#story"
							className="rounded-full border border-white/30 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
						>
							Our Philosophy
						</Link>
					</div>
				</div>
			</section>
			<section id="story" className="relative overflow-hidden bg-stone-100 py-24 md:py-32">
				<div className="container mx-auto px-4 md:px-8">
					<div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
						<div className="flex flex-col justify-center space-y-8">
							<span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-500">
								The OLD Way
							</span>
							<h2 className="font-serif text-4xl leading-tight text-gray-900 md:text-5xl">
								Lost in <span className="text-gray-500 line-through">Middlemen.</span>
								<br />
								Drowned in <span className="text-gray-500 line-through">Knockoffs.</span>
							</h2>
							<p className="max-w-md text-lg font-light leading-relaxed text-gray-600">
								Traditional retail is broken. Between the factory and your front door, a chain of middlemen
								extract value, forcing European brands to compete with unregulated, unsafe mass-production.
							</p>
							<p className="max-w-md text-lg font-light leading-relaxed text-gray-600">
								When you buy elsewhere, the creator sees pennies. When you buy here, you empower the studio.
							</p>
							<div className="border-l-2 border-gray-200 pl-6">
								<p className="font-serif text-2xl italic text-gray-500">
									&quot;Quality is not an act, it is a habit. But in a race to the bottom, habits are the
									first to break.&quot;
								</p>
							</div>
						</div>
						<div className="relative">
							<div className="absolute -left-6 -top-6 size-full rounded-2xl border border-terracotta/20 bg-transparent" />
							<div className="relative z-10 rounded-xl bg-white p-8 shadow-xl md:p-12">
								<span className="font-mono text-xs font-bold uppercase tracking-widest text-terracotta">
									The New Standard
								</span>
								<h3 className="mt-4 font-serif text-3xl text-gray-900">Direct Empowerment</h3>
								<div className="mt-8 space-y-8">
									<div className="flex gap-4">
										<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
											🛡️
										</div>
										<div>
											<h4 className="font-bold text-gray-900">Gated &amp; Verified</h4>
											<p className="mt-1 text-sm text-gray-600">
												We are a fortress for quality. Only brands adhering to strict EU labor and safety laws
												are allowed inside. No knockoffs, ever.
											</p>
										</div>
									</div>
									<div className="flex gap-4">
										<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
											🤝
										</div>
										<div>
											<h4 className="font-bold text-gray-900">Direct Revenue Share</h4>
											<p className="mt-1 text-sm text-gray-600">
												By removing the wholesale layer, our partner brands retain up to{" "}
												<span className="font-bold text-terracotta">3x more revenue</span>. You pay for
												quality, not logistics.
											</p>
										</div>
									</div>
									<div className="flex gap-4">
										<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
											🌱
										</div>
										<div>
											<h4 className="font-bold text-gray-900">Ethical &amp; Safe</h4>
											<p className="mt-1 text-sm text-gray-600">
												European regulations are the strictest in the world for a reason. Non-toxic materials,
												fair wages, and lasting durability.
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>
			<p className="py-24 text-center text-gray-500">
				Configure PAYLOAD_API_URL to enable CMS-powered content.
			</p>
		</main>
	);
}
