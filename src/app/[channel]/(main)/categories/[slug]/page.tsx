import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ProductListByCategoryDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export const generateMetadata = async (
	props: { params: Promise<{ slug: string; channel: string }> },
	_parent: ResolvingMetadata,
): Promise<Metadata> => {
	const params = await props.params;
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});
	return {
		title: `${category?.name || "Category"} | Salp`,
		description: category?.seoDescription || category?.description,
	};
};

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export default async function Page(props: { params: Promise<{ slug: string; channel: string }> }) {
	const params = await props.params;
	const { category } = await executeGraphQL(ProductListByCategoryDocument, {
		variables: { slug: params.slug, channel: params.channel },
		revalidate: 60,
	});

	if (!category || !category.products) {
		notFound();
	}

	const { name, products, description } = category;

	return (
		<div className="min-h-screen bg-vapor text-carbon">
			{/* --- HEADER --- */}
			<div className="sticky top-0 z-30 border-b border-gray-300 bg-vapor/95 backdrop-blur transition-all">
				<div className="mx-auto max-w-[1920px] px-4 py-4 md:px-8 md:py-6">
					<h1 className="text-2xl font-bold uppercase tracking-tighter md:text-4xl">{name}</h1>
					<div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
						<button className="whitespace-nowrap rounded-sm border border-carbon bg-carbon px-4 py-1 text-xs uppercase text-white">
							All Items
						</button>
						<button className="whitespace-nowrap rounded-sm border border-gray-300 bg-white px-4 py-1 text-xs uppercase text-gray-600 hover:border-cobalt">
							Best Sellers
						</button>
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-[1920px] px-4 pb-16 pt-8 md:px-8">
				{/* --- PRODUCT GRID --- */}
				<div className="grid grid-cols-2 gap-px border border-gray-200 bg-gray-200 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
					{products.edges.map(({ node: product }) => (
						<Link
							key={product.id}
							href={`/${params.channel}/products/${product.slug}`}
							className="group relative col-span-1 aspect-[3/4] bg-white transition-all duration-300 hover:z-10 focus:z-10"
						>
							<div className="relative h-full w-full overflow-hidden">
								{product.thumbnail && (
									<Image
										src={product.thumbnail.url}
										alt={product.thumbnail.alt || product.name}
										fill
										className="object-cover transition-transform duration-500 group-hover:scale-105"
										sizes="(max-width: 768px) 50vw, 25vw"
									/>
								)}

								<div className="absolute inset-0 bg-carbon/0 transition-colors duration-300 group-hover:bg-carbon/5" />

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
					))}
				</div>

				{/* --- SEO FOOTER --- */}
				{description && (
					<div className="mt-16 grid gap-8 border-t border-gray-300 pt-12 md:grid-cols-12">
						<div className="md:col-span-4">
							<span className="mb-2 block font-mono text-xs uppercase tracking-widest text-cobalt">
								Category Intelligence
							</span>
							<h2 className="text-xl font-bold">About {name}</h2>
						</div>
						<div className="prose prose-sm prose-neutral max-w-none md:col-span-8">
							{/* FIX: Explicitly cast JSON.parse result to 'any' to satisfy TypeScript compiler */}
							{/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */}
							{(JSON.parse(description) as any).blocks?.map((block: any) => (
								// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
								<p key={block.id as string} className="mb-4">
									{/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
									{block.data.text as string}
								</p>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
