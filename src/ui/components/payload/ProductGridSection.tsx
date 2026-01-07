import Link from "next/link";
import Image from "next/image";

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

interface ProductGridBlockData {
	sectionLabel?: string;
	heading?: string;
	maxProducts?: number;
	layout?: "masonry" | "grid";
	viewAllLabel?: string;
	viewAllUrl?: string;
}

interface ProductGridSectionProps {
	data: ProductGridBlockData;
	products: ProductNode[];
	channel: string;
	locale: string;
}

const formatPrice = (amount: number, currency: string) =>
	new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount);

export function ProductGridSection({ data, products, channel, locale }: ProductGridSectionProps) {
	if (products.length === 0) return null;

	const isMasonry = data.layout === "masonry";

	return (
		<section className={isMasonry ? "bg-white py-24" : "bg-stone-50 px-4 py-24 md:px-8"}>
			<div className={isMasonry ? "mx-auto max-w-[1920px] px-4 md:px-8" : "mx-auto max-w-[1920px]"}>
				{/* Header */}
				<div
					className={
						isMasonry
							? "mb-16 flex flex-col items-center text-center"
							: "mb-12 flex items-baseline justify-between"
					}
				>
					{data.sectionLabel && isMasonry && (
						<span className="mb-4 font-mono text-xs uppercase tracking-widest text-terracotta">
							{data.sectionLabel}
						</span>
					)}
					<h2
						className={
							isMasonry ? "font-serif text-4xl md:text-6xl" : "font-serif text-3xl text-gray-900 md:text-4xl"
						}
					>
						{data.heading || "Featured"}
					</h2>
					{data.viewAllLabel && !isMasonry && (
						<Link
							href={`/${channel}/${locale}${data.viewAllUrl || "/products"}`}
							className="text-sm font-bold uppercase text-terracotta hover:underline"
						>
							{data.viewAllLabel}
						</Link>
					)}
				</div>

				{/* Grid */}
				<div
					className={
						isMasonry
							? "grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-y-16"
							: "grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
					}
				>
					{products.map((product, idx) => {
						const name = product.translation?.name || product.name;
						const isLarge = isMasonry && (idx === 0 || idx === 3);
						const colSpan = isLarge ? "md:col-span-8" : "md:col-span-4";

						return (
							<Link
								key={product.id}
								href={`/${channel}/${locale}/products/${product.slug}`}
								className={isMasonry ? `group relative block ${colSpan} flex flex-col` : "group block"}
							>
								<div
									className={
										isMasonry
											? "relative aspect-[4/5] w-full overflow-hidden bg-gray-100"
											: "relative aspect-[3/4] w-full overflow-hidden bg-gray-200"
									}
								>
									{product.thumbnail && (
										<Image
											src={product.thumbnail.url}
											alt={product.thumbnail.alt || name}
											fill
											className={`object-cover transition-transform ${
												isMasonry ? "duration-700" : "duration-500"
											} group-hover:scale-105`}
											sizes={isMasonry ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 25vw"}
										/>
									)}
									{isMasonry && (
										<div className="absolute bottom-4 left-4 border border-white/50 bg-white/90 px-3 py-1 font-mono text-xs uppercase backdrop-blur-md transition-opacity group-hover:opacity-0">
											Verified EU
										</div>
									)}
									{!isMasonry && (
										<button className="absolute bottom-4 right-4 translate-y-4 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide opacity-0 shadow-lg transition-all duration-300 hover:bg-terracotta hover:text-white group-hover:translate-y-0 group-hover:opacity-100">
											Quick View
										</button>
									)}
								</div>
								<div className={isMasonry ? "mt-6" : "mt-4"}>
									{isMasonry ? (
										<>
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
										</>
									) : (
										<>
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
										</>
									)}
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}
