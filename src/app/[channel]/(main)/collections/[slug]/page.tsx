import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ProductListByCollectionDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

// --- FIX: Strict Types for EditorJS Content ---
interface EditorJsBlock {
	id: string;
	type: string;
	data: {
		text: string;
	};
}

interface EditorJsContent {
	time: number;
	blocks: EditorJsBlock[];
	version: string;
}
// ----------------------------------------------

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string }> },
	_parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});
	return {
		title: `${collection?.name || "Collection"} | Euro-Standard`,
		description: collection?.seoDescription || collection?.description,
	};
};

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: { params: Promise<{ slug: string; channel: string }> }) {
	const params = await props.params;
	const { collection } = await executeGraphQL(ProductListByCollectionDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});

	if (!collection || !collection.products) {
		notFound();
	}

	const { name, products, description } = collection;

	// --- FIX: Safe JSON Parsing with Type Guard ---
	let parsedContent: EditorJsContent | null = null;
	if (description) {
		try {
			const parsed = JSON.parse(description) ;
			// Basic validation to ensure it matches the interface
			if (typeof parsed === "object" && parsed !== null && "blocks" in parsed) {
				parsedContent = parsed as EditorJsContent;
			}
		} catch (e) {
			console.error("Failed to parse collection description", e);
		}
	}

	return (
		<div className="min-h-screen bg-stone-50 text-gray-900">
			{/* --- HEADER: Editorial Style [cite: 117-118] --- */}
			<div className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-6 md:px-8 md:py-8">
					<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-gray-400">
						The Edit
					</span>
					<h1 className="font-serif text-3xl font-medium text-gray-900 md:text-5xl">{name}</h1>
				</div>
			</div>

			<div className="mx-auto max-w-[1920px] px-4 pb-16 pt-8 md:px-8">
				<div className="flex flex-col gap-8 lg:flex-row">
					{/* --- SIDEBAR: Minimalist Filter [cite: 125] --- */}
					<aside className="hidden w-64 shrink-0 lg:block">
						<div className="sticky top-32 flex flex-col gap-8">
							<div>
								<h3 className="mb-3 font-serif text-sm font-bold uppercase tracking-wide">Category</h3>
								<ul className="space-y-2 font-mono text-xs text-gray-500">
									<li className="cursor-pointer hover:text-terracotta hover:underline">All Items</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Furniture</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Lighting</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Tableware</li>
								</ul>
							</div>
							<div>
								<h3 className="mb-3 font-serif text-sm font-bold uppercase tracking-wide">Origin</h3>
								<ul className="space-y-2 font-mono text-xs text-gray-500">
									<li className="cursor-pointer hover:text-terracotta hover:underline">Portugal</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Poland</li>
									<li className="cursor-pointer hover:text-terracotta hover:underline">Denmark</li>
								</ul>
							</div>
						</div>
					</aside>

					{/* --- MAIN CONTENT --- */}
					<div className="flex-1">
						{/* --- PRODUCT GRID (Standard Editorial Grid) --- */}
						<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 sm:grid-cols-3 xl:grid-cols-4">
							{products.edges.map(({ node: product }) => (
								<Link
									key={product.id}
									href={`/${params.channel}/products/${product.slug}`}
									className="group relative aspect-[3/4] bg-white transition-all duration-300 hover:z-10 focus:z-10"
								>
									<div className="relative h-full w-full overflow-hidden">
										{product.thumbnail && (
											<Image
												src={product.thumbnail.url}
												alt={product.thumbnail.alt || product.name}
												fill
												className="object-cover transition-transform duration-700 group-hover:scale-105"
												sizes="(max-width: 768px) 50vw, 25vw"
											/>
										)}

										{/* Hover Overlay */}
										<div className="absolute inset-0 flex flex-col justify-end bg-black/0 p-4 transition-colors duration-300 group-hover:bg-black/5" />

										{/* Product Info */}
										<div className="absolute bottom-0 left-0 right-0 border-t border-stone-100 bg-white p-4">
											<div className="flex flex-col gap-1">
												<h3 className="truncate font-serif text-base font-medium text-gray-900 group-hover:text-terracotta">
													{product.name}
												</h3>
												<div className="flex items-center justify-between">
													<span className="font-mono text-xs text-gray-400">
														{product.category?.name || "Object"}
													</span>
													<span className="font-mono text-sm text-gray-900">
														{formatPrice(
															product.pricing?.priceRange?.start?.gross.amount || 0,
															product.pricing?.priceRange?.start?.gross.currency || "EUR",
														)}
													</span>
												</div>
											</div>
										</div>
									</div>
								</Link>
							))}
						</div>

						{/* --- SEO / Buying Guide Footer [cite: 21-23] --- */}
						{parsedContent && (
							<div className="mt-16 border-t border-gray-200 pt-12">
								<span className="mb-4 block font-mono text-xs uppercase tracking-widest text-terracotta">
									Buying Guide
								</span>
								<h2 className="mb-6 font-serif text-2xl font-medium text-gray-900">About {name}</h2>
								<div className="prose prose-sm prose-neutral max-w-none prose-headings:font-serif prose-a:text-terracotta">
									{/* FIX: Map over strictly typed blocks */}
									{parsedContent.blocks.map((block) => (
										<p key={block.id} className="mb-4 break-inside-avoid leading-relaxed text-gray-600">
											{block.data.text}
										</p>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
