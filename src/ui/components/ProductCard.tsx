import Link from "next/link";
import Image from "next/image";

interface ProductCardProps {
	product: {
		id: string;
		slug: string;
		name: string;
		thumbnail?: {
			url: string;
			alt?: string | null;
		} | null;
		category?: {
			name: string;
		} | null;
		pricing?: {
			priceRange?: {
				start?: {
					gross: {
						amount: number;
						currency: string;
					};
				} | null;
			} | null;
		} | null;
		translation?: {
			name?: string | null;
		} | null;
	};
	channel: string;
	locale: string;
}

export function ProductCard({ product, channel, locale }: ProductCardProps) {
	const priceAmount = product.pricing?.priceRange?.start?.gross.amount || 0;
	const priceCurrency = product.pricing?.priceRange?.start?.gross.currency || "EUR";
	const formattedPrice = new Intl.NumberFormat("en-IE", {
		style: "currency",
		currency: priceCurrency,
	}).format(priceAmount);

	return (
		<Link
			href={`/${channel}/${locale}/products/${product.slug}`}
			className="group relative flex flex-col overflow-hidden bg-white"
			data-testid="ProductCard"
		>
			<div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
				{product.thumbnail ? (
					<Image
						src={product.thumbnail.url}
						alt={product.thumbnail.alt || product.name}
						fill
						className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-105"
						sizes="(max-width: 768px) 50vw, 25vw"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-stone-100 text-stone-300">
						<span className="font-mono text-xs">No Image</span>
					</div>
				)}

				{/* Quick Action Overlay */}
				<div className="absolute inset-x-0 bottom-0 translate-y-full bg-stone-50/90 px-4 py-3 backdrop-blur-sm transition-transform duration-300 group-hover:translate-y-0">
					<p className="text-center font-sans text-xs font-medium uppercase tracking-widest text-gray-900">
						View Details
					</p>
				</div>
			</div>

			<div className="mt-4 flex flex-col gap-1 px-1 pb-4">
				<div className="flex items-baseline justify-between gap-4">
					<h3 className="font-serif text-base leading-snug text-gray-900 transition-colors group-hover:text-terracotta">
						{product.translation?.name || product.name}
					</h3>
					<span className="shrink-0 font-sans text-sm text-gray-900">{formattedPrice}</span>
				</div>
				<p className="font-sans text-xs tracking-wide text-gray-500">{product.category?.name || "Object"}</p>
			</div>
		</Link>
	);
}
