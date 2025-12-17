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
			className="group block"
			data-testid="ProductCard"
		>
			<div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-200">
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
						<span className="font-sans text-xs">No Image</span>
					</div>
				)}

				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 via-25% to-transparent transition-opacity group-hover:opacity-90" />

				<div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
					<div className="flex flex-col text-white">
						<h3 className="font-serif text-xl font-medium leading-tight">
							{product.translation?.name || product.name}
						</h3>
						<div className="mt-1 h-0.5 w-8 bg-terracotta opacity-0 transition-opacity group-hover:opacity-100" />
					</div>
					<span className="rounded bg-white/20 px-2 py-1 font-sans text-sm font-bold text-white/90 backdrop-blur-md">
						{formattedPrice}
					</span>
				</div>
			</div>
		</Link>
	);
}
