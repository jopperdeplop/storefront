import Link from "next/link";
import Image from "next/image";
import edjsHTML from "editorjs-html";
import {
	HomepageContentDocument,
	BrandPageTypeDocument,
	type LanguageCodeEnum,
	type BrandPageTypeQuery,
} from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

const parser = edjsHTML();

// --- 1. STRICT LOCAL TYPE DEFINITIONS ---
interface ImageValue {
	url: string;
	alt?: string | null;
}

interface FileAttribute {
	value?: {
		url?: string;
	} | null;
}

interface Translation {
	title?: string;
	content?: string;
	name?: string;
}

interface PageNode {
	title?: string;
	content?: string;
	translation?: Translation | null;
	heroImage?: FileAttribute | null;
}

interface ProductNode {
	id: string;
	slug: string;
	name: string;
	thumbnail?: ImageValue | null;
	category?: { name: string } | null;
	pricing?: {
		priceRange?: {
			start?: {
				gross: { amount: number; currency: string };
			};
		} | null;
	} | null;
	translation?: Translation | null;
}

interface CollectionNode {
	name?: string;
	translation?: Translation | null;
	products?: {
		edges: Array<{ node: ProductNode }>;
	} | null;
}

interface BrandNode {
	id: string;
	title: string;
	slug: string;
	logo?: FileAttribute | null;
}

interface HomepageQueryResponse {
	hero?: PageNode | null;
	spotlight?: PageNode | null;
	featured?: CollectionNode | null;
	brands?: {
		edges: Array<{ node: BrandNode }>;
	} | null;
}

// --- 2. HELPERS ---

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: { params: Promise<{ channel: string; locale: string }> }) {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	// --- 3. FETCH DATA ---
	// Step A: Get the 'Brand' Page Type ID
	const brandTypeRaw = await executeGraphQL(BrandPageTypeDocument, {
		revalidate: 600, // Cache for longer
	});
	const brandTypeData = brandTypeRaw as unknown as BrandPageTypeQuery;

	// Find the ID (assuming 'Brand' is the name)
	const brandPageTypeId = brandTypeData.pageTypes?.edges?.[0]?.node.id;

	// Step B: Fetch Homepage Content with the filter
	const rawData = await executeGraphQL(HomepageContentDocument, {
		variables: {
			channel: params.channel,
			locale: localeEnum,
			brandPageTypeId: brandPageTypeId ? [brandPageTypeId] : [],
		},
		revalidate: 60,
	});

	const data = rawData as unknown as HomepageQueryResponse;

	// --- 4. DATA PROCESSING ---

	const getText = (node: PageNode | null | undefined) => ({
		title: node?.translation?.title || node?.title || "",
		contentJson: node?.translation?.content || node?.content || null,
	});

	const getHeroImage = (node: PageNode | null | undefined) => {
		const attr = node?.heroImage;
		if (attr && attr.value?.url) {
			return attr.value.url;
		}
		// Default Fallback - European Atelier Vibe
		return "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2500";
	};

	const hero = getText(data.hero);

	const heroImageUrl = getHeroImage(data.hero);

	const collectionName = data.featured?.translation?.name || data.featured?.name || "Featured";

	// Safely map products
	const allProducts = data.featured?.products?.edges.map((e) => e.node) || [];

	const spotlightProducts = allProducts.slice(0, 4);
	const mainFeed = allProducts.slice(4);

	// Map from Pages connection to simple list, filtering only those with logos
	const brandItems = data.brands?.edges.map((e) => e.node).filter((brand) => brand.logo?.value?.url) || [];

	// Parse Hero Subtitle
	let heroSubtitle = "";
	try {
		if (hero.contentJson) {
			const parsedJson = JSON.parse(hero.contentJson) as { blocks: unknown[] };
			const html = parser.parse(parsedJson);
			if (Array.isArray(html) && html.length > 0) {
				heroSubtitle = html[0].replace(/<[^>]*>?/gm, "");
			}
		}
	} catch (e) {
		console.error("Error parsing hero content", e);
	}

	return (
		<main className="min-h-screen bg-stone-50 text-gray-900 selection:bg-terracotta selection:text-white">
			{/* --- HERO SECTION: The Premium Standard --- */}
			<section className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-900 text-white">
				<div className="absolute inset-0 opacity-70">
					<Image
						src={heroImageUrl}
						alt={hero.title || "European Craftsmanship"}
						fill
						className="object-cover"
						priority
					/>
				</div>
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

				<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
					<span className="mb-6 rounded-full border border-white/30 bg-white/10 px-4 py-1 font-mono text-xs font-medium uppercase tracking-[0.2em] backdrop-blur-md">
						Verified European Origin
					</span>
					<h1 className="max-w-5xl font-serif text-6xl font-medium leading-tight tracking-tight md:text-8xl lg:text-9xl">
						{hero.title || "The European \n Standard."}
					</h1>
					<p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-gray-100 md:text-xl">
						{heroSubtitle ||
							"A gated community of verified European makers. No middlemen. No compromise on quality. Just improved margins for creators."}
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

			{/* --- NARRATIVE SECTION: Middlemen & Empowerment --- */}
			<section id="story" className="relative overflow-hidden bg-stone-100 py-24 md:py-32">
				<div className="container mx-auto px-4 md:px-8">
					<div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
						{/* Left: The Problem (Middlemen/Knockoffs) */}
						<div className="flex flex-col justify-center space-y-8">
							<span className="font-mono text-xs font-bold uppercase tracking-widest text-gray-400">
								The OLD Way
							</span>
							<h2 className="font-serif text-4xl leading-tight text-gray-900 md:text-5xl">
								Lost in <span className="text-gray-400 line-through">Middlemen.</span>
								<br />
								Drowned in <span className="text-gray-400 line-through">Knockoffs.</span>
							</h2>
							<p className="max-w-md text-lg font-light leading-relaxed text-gray-600">
								Traditional retail is broken. Between the factory and your front door, a chain of middlemen
								extract value, forcing European brands to compete with unregulated, unsafe mass-production.
							</p>
							<p className="max-w-md text-lg font-light leading-relaxed text-gray-600">
								When you buy elsewhere, the creator sees pennies. When you buy here, you empower the studio.
							</p>

							<div className="border-l-2 border-gray-200 pl-6">
								<p className="font-serif text-2xl italic text-gray-400">
									&quot;Quality is not an act, it is a habit. But in a race to the bottom, habits are the
									first to break.&quot;
								</p>
							</div>
						</div>

						{/* Right: The Solution (Empowerment) */}
						<div className="relative">
							<div className="absolute -left-6 -top-6 h-full w-full rounded-2xl border border-terracotta/20 bg-transparent" />
							<div className="relative z-10 rounded-xl bg-white p-8 shadow-xl md:p-12">
								<span className="font-mono text-xs font-bold uppercase tracking-widest text-terracotta">
									The New Standard
								</span>
								<h3 className="mt-4 font-serif text-3xl text-gray-900">Direct Empowerment</h3>

								<div className="mt-8 space-y-8">
									<div className="flex gap-4">
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
											🛡️
										</div>
										<div>
											<h4 className="font-bold text-gray-900">Gated & Verified</h4>
											<p className="mt-1 text-sm text-gray-600">
												We are a fortress for quality. Only brands adhering to strict EU labor and safety laws
												are allowed inside. No knockoffs, ever.
											</p>
										</div>
									</div>

									<div className="flex gap-4">
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
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
										<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
											🌱
										</div>
										<div>
											<h4 className="font-bold text-gray-900">Ethical & Safe</h4>
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

			{/* --- BRAND STRIP: Infinite Ticker --- */}
			{brandItems.length > 0 && (
				<section className="overflow-hidden bg-stone-100 py-8 md:py-16">
					<div className="mx-auto mb-6 max-w-7xl px-4 text-center md:mb-10 md:px-8">
						<span className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500">
							Verified European Partners
						</span>
					</div>

					{/* Infinite Scroll Container - Gradient adjusted for stone-100 */}
					<div className="relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
						<div className="animate-marquee flex whitespace-nowrap py-4">
							{[...brandItems, ...brandItems, ...brandItems].map((item, idx) => {
								// Triple for smooth loop
								const logoUrl = item.logo?.value?.url;
								if (!logoUrl) return null;

								return (
									<Link
										key={`${item.id}-${idx}`}
										href={`/pages/${item.slug}`}
										className="relative mx-5 block h-12 w-32 opacity-50 mix-blend-multiply grayscale transition-all duration-500 hover:scale-110 hover:opacity-100 hover:grayscale-0 md:mx-12 md:h-16 md:w-48"
									>
										<Image src={logoUrl} alt={item.title} fill className="object-contain" sizes="192px" />
									</Link>
								);
							})}
						</div>
					</div>
				</section>
			)}

			{/* --- FEATURED COLLECTION (Masonry / Editorial) --- */}
			{spotlightProducts.length > 0 && (
				<section className="bg-white py-24">
					<div className="mx-auto max-w-[1920px] px-4 md:px-8">
						<div className="mb-16 flex flex-col items-center text-center">
							<span className="mb-4 font-mono text-xs uppercase tracking-widest text-terracotta">
								The Audit
							</span>
							<h2 className="font-serif text-4xl md:text-6xl">{collectionName}</h2>
						</div>

						<div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-y-16">
							{spotlightProducts.map((product, idx) => {
								const name = product.translation?.name || product.name;
								// Create a varied grid layout
								const isLarge = idx === 0 || idx === 3;
								const colSpan = isLarge ? "md:col-span-8" : "md:col-span-4";

								return (
									<Link
										key={product.id}
										href={`/${params.channel}/${params.locale}/products/${product.slug}`}
										className={`group relative block ${colSpan} flex flex-col`}
									>
										<div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
											{product.thumbnail && (
												<Image
													src={product.thumbnail.url}
													alt={product.thumbnail.alt || name}
													fill
													className="object-cover transition-transform duration-700 group-hover:scale-105"
													sizes="(max-width: 768px) 100vw, 50vw"
												/>
											)}
											<div className="absolute bottom-4 left-4 border border-white/50 bg-white/90 px-3 py-1 font-mono text-xs uppercase backdrop-blur-md transition-opacity group-hover:opacity-0">
												Verified EU
											</div>
										</div>
										<div className="mt-6">
											<div className="flex items-baseline justify-between border-b border-gray-100 pb-2">
												<h3 className="font-serif text-xl font-medium text-gray-900 transition-colors group-hover:text-terracotta">
													{name}
												</h3>
												<span className="font-mono text-sm font-medium text-gray-900">
													{formatPrice(
														product.pricing?.priceRange?.start?.gross.amount || 0,
														product.pricing?.priceRange?.start?.gross.currency || "EUR",
													)}
												</span>
											</div>
											<p className="mt-2 text-sm text-gray-500">{product.category?.name}</p>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</section>
			)}

			{/* --- CURATED COLLECTIONS (Horizontal Scroll) --- */}
			<section className="overflow-hidden bg-stone-100 py-24">
				<div className="mx-auto max-w-[1920px] px-4 md:px-8">
					<div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
						<div>
							<span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
								Lifestyle
							</span>
							<h2 className="font-serif text-4xl text-gray-900 md:text-5xl">Curated Collections</h2>
						</div>
						<div className="hidden md:block">
							<span className="font-mono text-xs text-gray-500">Scroll to explore →</span>
						</div>
					</div>

					{/* Scroll Container */}
					<div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-8 md:-mx-8 md:px-8">
						{[
							{
								title: "The Minimalist Office",
								subtitle: "Focus without distraction.",
								image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1200",
								slug: "office",
							},
							{
								title: "Sustainable Living",
								subtitle: "Ethical choices for every day.",
								image: "https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=1200",
								slug: "sustainable",
							},
							{
								title: "The Weekend Bag",
								subtitle: "Escape in style.",
								image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1200",
								slug: "travel",
							},
						].map((item, idx) => (
							<Link
								key={idx}
								href={`/${params.channel}/${params.locale}/products`} // Linking to products as placeholder
								className="group relative h-[600px] w-[85vw] flex-none snap-center overflow-hidden rounded-xl bg-gray-200 md:w-[45vw] lg:w-[30vw]"
							>
								<Image
									src={item.image}
									alt={item.title}
									fill
									className="object-cover transition-transform duration-700 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

								<div className="absolute bottom-0 left-0 p-8 md:p-12">
									<h3 className="font-serif text-3xl text-white md:text-4xl">{item.title}</h3>
									<p className="mt-2 text-lg font-light text-gray-200">{item.subtitle}</p>
									<div className="mt-6 inline-flex items-center gap-2 border-b border-terracotta pb-1 text-sm font-bold uppercase tracking-widest text-white transition-all group-hover:border-white">
										Explore
									</div>
								</div>
							</Link>
						))}
					</div>
				</div>
			</section>

			{mainFeed.length > 0 && (
				<section className="bg-stone-50 px-4 py-24 md:px-8">
					<div className="mx-auto max-w-[1920px]">
						<div className="mb-12 flex items-baseline justify-between">
							<h2 className="font-serif text-3xl text-gray-900 md:text-4xl">Curated Arrivals</h2>
							<Link
								href={`/${params.channel}/${params.locale}/products`}
								className="text-sm font-bold uppercase text-terracotta hover:underline"
							>
								View All
							</Link>
						</div>

						<div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
							{mainFeed.map((product) => {
								const name = product.translation?.name || product.name;
								return (
									<Link
										key={product.id}
										href={`/${params.channel}/${params.locale}/products/${product.slug}`}
										className="group block"
									>
										<div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-200">
											{product.thumbnail && (
												<Image
													src={product.thumbnail.url}
													alt={product.thumbnail.alt || name}
													fill
													className="object-cover transition-transform duration-500 group-hover:scale-105"
													sizes="(max-width: 768px) 50vw, 25vw"
												/>
											)}
											<button className="absolute bottom-4 right-4 translate-y-4 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide opacity-0 shadow-lg transition-all duration-300 hover:bg-terracotta hover:text-white group-hover:translate-y-0 group-hover:opacity-100">
												Quick View
											</button>
										</div>
										<div className="mt-4">
											<h3 className="truncate font-serif text-lg text-gray-900">{name}</h3>
											<div className="mt-1 flex items-center justify-between">
												<p className="font-mono text-xs text-gray-500">{product.category?.name}</p>
												<span className="font-medium text-gray-900">
													{formatPrice(
														product.pricing?.priceRange?.start?.gross.amount || 0,
														product.pricing?.priceRange?.start?.gross.currency || "EUR",
													)}
												</span>
											</div>
										</div>
									</Link>
								);
							})}
						</div>
					</div>
				</section>
			)}
		</main>
	);
}
