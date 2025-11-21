import Link from "next/link";
import Image from "next/image";
import { ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export const metadata = {
	title: "SALP | European Industrial Utility",
	description: "The operating system for commerce.",
};

// HELPER: Formats price cleanly
const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: { params: Promise<{ channel: string }> }) {
	const params = await props.params;

	// Fetching the "Featured" collection as the base source
	const data = await executeGraphQL(ProductListByCollectionDocument, {
		variables: {
			slug: "featured-products",
			channel: params.channel,
		},
		revalidate: 60,
	});

	if (!data.collection?.products) return null;

	const allProducts = data.collection?.products.edges.map(({ node }) => node);

	// STRATEGY: Split data to simulate the "Trending" carousel vs "Main Feed"
	const trending = allProducts.slice(0, 4);
	const mainFeed = allProducts.slice(4);

	return (
		<main className="min-h-screen bg-vapor text-carbon selection:bg-cobalt selection:text-white">
			{/* --- HEADER: "Precision Instrument" Feel --- */}
			<header className="mx-auto max-w-[1920px] px-4 py-8 md:px-8 md:py-12">
				<h1 className="mb-2 text-3xl font-bold uppercase tracking-tighter md:text-6xl">
					Salp<span className="text-cobalt">.</span>
				</h1>
				<p className="max-w-md font-mono text-sm uppercase tracking-wide text-gray-500 md:text-base">
					Concierge Marketplace / Est. 2025 / Delft, NL
				</p>
			</header>

			{/* --- MOBILE LAYOUT: Horizontal Scroll + Feed --- */}
			<div className="pb-24 md:hidden">
				{/* Section: Trending (Horizontal Swipe with Snap) */}
				<section className="mb-8">
					<div className="mb-3 flex items-center justify-between px-4">
						<h2 className="text-sm font-bold uppercase tracking-wider">Trending</h2>
						<span className="font-mono text-xs text-cobalt">SWIPE &rarr;</span>
					</div>

					<div className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
						{trending.map((product) => (
							<Link
								key={product.id}
								// FIX: Include params.channel in the URL
								href={`/${params.channel}/products/${product.slug}`}
								className="group relative w-[85vw] shrink-0 snap-center"
							>
								<div className="relative aspect-[4/5] overflow-hidden border border-gray-200 bg-white">
									{product.thumbnail && (
										<Image
											src={product.thumbnail.url}
											alt={product.thumbnail.alt || product.name}
											fill
											className="object-cover object-center"
											sizes="(max-width: 768px) 85vw"
										/>
									)}
									{/* Overlay Utility Info */}
									<div className="absolute bottom-0 left-0 w-full border-t border-gray-100 bg-white/90 p-3 backdrop-blur-sm">
										<h3 className="truncate text-sm font-semibold">{product.name}</h3>
										<p className="font-mono text-xs text-gray-500">
											{formatPrice(
												product.pricing?.priceRange?.start?.gross.amount || 0,
												product.pricing?.priceRange?.start?.gross.currency || "EUR",
											)}
										</p>
									</div>
								</div>
							</Link>
						))}
					</div>
				</section>

				{/* Section: The Feed (Vertical Stack) */}
				<section className="space-y-12 px-4">
					<div className="mb-6 border-b border-gray-300 pb-2">
						<h2 className="text-sm font-bold uppercase tracking-wider">New Arrivals</h2>
					</div>
					{mainFeed.map((product) => (
						<Link
							key={product.id}
							// FIX: Include params.channel in the URL
							href={`/${params.channel}/products/${product.slug}`}
							className="block"
						>
							<div className="relative mb-3 aspect-square border border-gray-200 bg-white">
								{product.thumbnail && (
									<Image
										src={product.thumbnail.url}
										alt={product.thumbnail.alt || product.name}
										fill
										className="object-cover"
										sizes="(max-width: 768px) 100vw"
									/>
								)}
							</div>
							<div className="flex items-baseline justify-between">
								<h3 className="w-3/4 text-base font-medium leading-tight">{product.name}</h3>
								<span className="font-mono text-sm text-cobalt">
									{formatPrice(
										product.pricing?.priceRange?.start?.gross.amount || 0,
										product.pricing?.priceRange?.start?.gross.currency || "EUR",
									)}
								</span>
							</div>
						</Link>
					))}
				</section>
			</div>

			{/* --- DESKTOP LAYOUT: The Bento / Masonry Grid --- */}
			<div className="mx-auto hidden max-w-[1920px] px-8 pb-16 md:block">
				{/* Grid Definition: Auto-fill with min 300px, dense flow for packing */}
				<div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-px border border-gray-200 bg-gray-200">
					{allProducts.map((product, index) => {
						// Logic to make some items span 2 columns for "Bento" look
						// We make every 5th item "Featured" (Large)
						const isLarge = index % 5 === 0;

						return (
							<Link
								key={product.id}
								// FIX: Include params.channel in the URL
								href={`/${params.channel}/products/${product.slug}`}
								className={`group relative aspect-[3/4] bg-white transition-all duration-300 hover:z-10 focus:z-10 ${
									isLarge ? "col-span-2 row-span-2" : "col-span-1"
								}`}
							>
								<div className="relative h-full w-full overflow-hidden">
									{product.thumbnail && (
										<Image
											src={product.thumbnail.url}
											alt={product.thumbnail.alt || product.name}
											fill
											className="object-cover transition-transform duration-500 group-hover:scale-105"
											sizes={isLarge ? "50vw" : "25vw"}
										/>
									)}

									{/* Hover State Overlay: "Digital Material" */}
									<div className="absolute inset-0 bg-carbon/0 transition-colors duration-300 group-hover:bg-carbon/5" />

									{/* Product Info - Always visible but subtle, bolder on hover */}
									<div className="absolute bottom-0 left-0 right-0 translate-y-0 transform border-t border-gray-100 bg-white p-4 transition-transform">
										<div className="flex items-start justify-between">
											<div>
												<h3 className="text-sm font-bold uppercase tracking-wide text-carbon transition-colors group-hover:text-cobalt">
													{product.name}
												</h3>
												<p className="mt-1 hidden font-mono text-xs text-gray-400 group-hover:block">
													Category: {product.category?.name || "General"}
												</p>
											</div>
											<span className="rounded-sm bg-gray-100 px-2 py-1 font-mono text-sm transition-colors group-hover:bg-cobalt group-hover:text-white">
												{formatPrice(
													product.pricing?.priceRange?.start?.gross.amount || 0,
													product.pricing?.priceRange?.start?.gross.currency || "EUR",
												)}
											</span>
										</div>
									</div>
								</div>
							</Link>
						);
					})}

					{/* Static Knowledge Card Injection */}
					<div className="col-span-2 flex aspect-[2/1] flex-col justify-between bg-carbon p-8 text-vapor">
						<div>
							<span className="mb-2 block font-mono text-xs uppercase text-cobalt">System Note</span>
							<h3 className="text-2xl font-bold leading-tight">Why we automate local commerce.</h3>
							<p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
								Salp connects European artisans with mass consumers through a high-margin dropshipping
								backfill.
							</p>
						</div>
						<div className="text-right">
							<span className="cursor-pointer border-b border-cobalt pb-1 text-sm uppercase tracking-widest">
								Read the manifesto
							</span>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
