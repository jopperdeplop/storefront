import Link from "next/link";
import Image from "next/image";
import edjsHTML from "editorjs-html";
import { HomepageContentDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

const parser = edjsHTML();

// --- 1. STRICT LOCAL TYPE DEFINITIONS ---
// Updated: 'url' is now mandatory in ImageValue to satisfy Next.js <Image src />
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

interface HomepageQueryResponse {
	hero?: PageNode | null;
	spotlight?: PageNode | null;
	featured?: CollectionNode | null;
}

// --- 2. HELPERS ---

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: { params: Promise<{ channel: string; locale: string }> }) {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	// --- 3. FETCH DATA ---
	// We use 'as unknown as HomepageQueryResponse' to forcefully tell TypeScript
	// that this data matches our strict local interfaces.
	const rawData = await executeGraphQL(HomepageContentDocument, {
		variables: {
			channel: params.channel,
			locale: localeEnum,
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
		// Default Fallback
		return "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2500";
	};

	const hero = getText(data.hero);
	const spotlight = getText(data.spotlight);
	const heroImageUrl = getHeroImage(data.hero);

	const collectionName = data.featured?.translation?.name || data.featured?.name || "Featured";

	// Safely map products
	const allProducts = data.featured?.products?.edges.map((e) => e.node) || [];

	const spotlightProducts = allProducts.slice(0, 4);
	const mainFeed = allProducts.slice(4);

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
			{/* --- HERO SECTION --- */}
			<section className="relative h-[85vh] w-full overflow-hidden bg-gray-900 text-white">
				<div className="absolute inset-0 opacity-60">
					<Image src={heroImageUrl} alt={hero.title || "Hero"} fill className="object-cover" priority />
				</div>
				<div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
					<span className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-gray-200">
						Est. 2025 • Delft
					</span>
					<h1 className="max-w-4xl font-serif text-5xl font-medium leading-tight md:text-8xl">
						{hero.title || "The New European Standard."}
					</h1>
					<p className="mt-6 max-w-lg text-lg font-light text-gray-200">
						{heroSubtitle || "Unifying fragmented makers and brands into a single power bloc."}
					</p>

					<Link
						href={`/${params.channel}/${params.locale}/products`}
						className="mt-8 rounded-full bg-terracotta px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-transform hover:scale-105 hover:bg-terracotta-dark"
					>
						Discover the Collection
					</Link>
				</div>
			</section>

			{/* --- NEW ARRIVALS --- */}
			{spotlightProducts.length > 0 && (
				<section className="mx-auto max-w-[1920px] px-4 py-16 md:px-8">
					<div className="mb-10 flex items-end justify-between border-b border-gray-200 pb-4">
						<div>
							<span className="font-mono text-xs uppercase text-gray-500">Curated Selection</span>
							<h2 className="font-serif text-3xl text-gray-900 md:text-4xl">{collectionName}</h2>
						</div>
						<Link
							href={`/${params.channel}/${params.locale}/products`}
							className="hidden font-mono text-xs uppercase tracking-wide underline md:block"
						>
							View All Arrivals
						</Link>
					</div>

					<div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
						{spotlightProducts.map((product) => {
							const name = product.translation?.name || product.name;
							return (
								<Link
									key={product.id}
									href={`/${params.channel}/${params.locale}/products/${product.slug}`}
									className="group block"
								>
									<div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
										{product.thumbnail && (
											<Image
												src={product.thumbnail.url}
												alt={product.thumbnail.alt || name}
												fill
												className="object-cover transition-transform duration-700 group-hover:scale-105"
												sizes="(max-width: 768px) 50vw, 25vw"
											/>
										)}
										<div className="absolute left-2 top-2 bg-white/90 px-2 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur-sm">
											Direct from Atelier
										</div>
									</div>
									<div className="mt-4">
										<h3 className="font-serif text-lg leading-none group-hover:underline">{name}</h3>
										<p className="mt-1 font-mono text-xs text-gray-500">
											{formatPrice(
												product.pricing?.priceRange?.start?.gross.amount || 0,
												product.pricing?.priceRange?.start?.gross.currency || "EUR",
											)}
										</p>
									</div>
								</Link>
							);
						})}
					</div>
				</section>
			)}

			{/* --- SPOTLIGHT BLOCK --- */}
			<section className="bg-stone-100 py-20">
				<div className="mx-auto grid max-w-[1920px] grid-cols-1 md:grid-cols-2">
					<div className="relative min-h-[400px] w-full bg-gray-300">
						<Image
							src="https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=2000"
							alt="Potter at work"
							fill
							className="object-cover grayscale transition-all hover:grayscale-0"
						/>
					</div>
					<div className="flex flex-col justify-center px-8 py-12 md:px-24">
						<span className="mb-2 font-mono text-xs uppercase text-terracotta">Atelier Visit</span>
						<h2 className="mb-6 font-serif text-4xl md:text-5xl">{spotlight.title}</h2>

						<div className="prose mb-8 max-w-md text-lg font-light leading-relaxed text-gray-600 prose-p:my-2">
							{spotlight.contentJson &&
								parser
									.parse(JSON.parse(spotlight.contentJson) as { blocks: unknown[] })
									.map((html) => <div key={html} dangerouslySetInnerHTML={{ __html: html }} />)}
						</div>

						<button className="w-fit border-b border-gray-900 pb-1 font-mono text-xs uppercase tracking-widest hover:border-terracotta hover:text-terracotta">
							Read the Partner Profile
						</button>
					</div>
				</div>
			</section>

			{/* --- EDUCATION BLOCK --- */}
			<section className="border-b border-gray-200 bg-white py-16">
				<div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-8 text-center md:grid-cols-3">
					<div className="flex flex-col items-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl">
							⚓
						</div>
						<h3 className="mb-2 font-serif text-lg font-bold">Direct from Source</h3>
						<p className="text-sm text-gray-500">
							We connect you directly to the maker. No warehouses, no middlemen, just a digital bridge.
						</p>
					</div>
					<div className="flex flex-col items-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl">
							🇪🇺
						</div>
						<h3 className="mb-2 font-serif text-lg font-bold">Verified European</h3>
						<p className="text-sm text-gray-500">
							Every item is physically produced within the EU. We audit supply chains so you don&apos;t have
							to.
						</p>
					</div>
					<div className="flex flex-col items-center">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-xl">
							🚚
						</div>
						<h3 className="mb-2 font-serif text-lg font-bold">Sustainable Logistics</h3>
						<p className="text-sm text-gray-500">
							We use existing routes and consolidate freight to minimize the carbon cost of quality.
						</p>
					</div>
				</div>
			</section>

			{/* --- THE EDIT --- */}
			{mainFeed.length > 0 && (
				<section className="mx-auto max-w-[1920px] px-4 py-20 md:px-8">
					<div className="mb-12 text-center">
						<h2 className="font-serif text-4xl">The Edit</h2>
						<p className="mt-2 font-mono text-xs text-gray-500">
							Sustainable oak and walnut pieces from independent workshops.
						</p>
					</div>

					<div className="grid grid-cols-1 gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
						{mainFeed.map((product, index) => {
							const name = product.translation?.name || product.name;
							const isHero = index === 0 || index === 5;

							return (
								<Link
									key={product.id}
									href={`/${params.channel}/${params.locale}/products/${product.slug}`}
									className={`group relative bg-white p-4 transition-all hover:z-10 ${
										isHero ? "aspect-square md:col-span-2 md:row-span-2" : "aspect-[3/4] md:col-span-1"
									}`}
								>
									<div className="relative h-full w-full overflow-hidden">
										{product.thumbnail && (
											<Image
												src={product.thumbnail.url}
												alt={product.thumbnail.alt || name}
												fill
												className="object-cover transition-transform duration-700 group-hover:scale-105"
												sizes={isHero ? "50vw" : "25vw"}
											/>
										)}

										<div className="absolute inset-0 flex flex-col justify-end bg-black/0 p-6 transition-colors group-hover:bg-black/10">
											<div className="translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
												<span className="bg-white px-2 py-1 font-mono text-xs uppercase text-black shadow-sm">
													Shop Now
												</span>
											</div>
										</div>
									</div>

									<div className="mt-4 flex items-baseline justify-between">
										<div>
											<h3 className="font-serif text-lg font-medium">{name}</h3>
											<p className="font-mono text-xs text-gray-400">{product.category?.name}</p>
										</div>
										<span className="font-mono text-sm">
											{formatPrice(
												product.pricing?.priceRange?.start?.gross.amount || 0,
												product.pricing?.priceRange?.start?.gross.currency || "EUR",
											)}
										</span>
									</div>
								</Link>
							);
						})}
					</div>
				</section>
			)}
		</main>
	);
}
