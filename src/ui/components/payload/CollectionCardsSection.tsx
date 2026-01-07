import Link from "next/link";
import Image from "next/image";

interface CollectionCard {
	title?: string;
	subtitle?: string;
	image?: { url?: string };
	imageUrl?: string;
	linkUrl?: string;
	ctaLabel?: string;
}

interface CollectionCardsBlockData {
	sectionLabel?: string;
	heading?: string;
	scrollHint?: string;
	cards?: CollectionCard[];
}

interface CollectionCardsSectionProps {
	data: CollectionCardsBlockData;
	channel: string;
	locale: string;
}

export function CollectionCardsSection({ data, channel, locale }: CollectionCardsSectionProps) {
	const cards = data.cards || [];
	if (cards.length === 0) return null;

	return (
		<section className="overflow-hidden bg-stone-100 py-24">
			<div className="mx-auto max-w-[1920px] px-4 md:px-8">
				<div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
					<div>
						{data.sectionLabel && (
							<span className="mb-4 block font-mono text-xs uppercase tracking-[0.2em] text-terracotta">
								{data.sectionLabel}
							</span>
						)}
						<h2 className="font-serif text-4xl text-gray-900 md:text-5xl">
							{data.heading || "Curated Collections"}
						</h2>
					</div>
					{data.scrollHint && (
						<div className="hidden md:block">
							<span className="font-mono text-xs text-gray-500">{data.scrollHint}</span>
						</div>
					)}
				</div>

				{/* Scroll Container */}
				<div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-8 md:-mx-8 md:px-8">
					{cards.map((card, idx) => {
						const imageUrl = card.image?.url || card.imageUrl;
						if (!imageUrl) return null;

						return (
							<Link
								key={idx}
								href={`/${channel}/${locale}${card.linkUrl || "/products"}`}
								className="group relative h-[600px] w-[85vw] flex-none snap-center overflow-hidden rounded-xl bg-gray-200 md:w-[45vw] lg:w-[30vw]"
							>
								<Image
									src={imageUrl}
									alt={card.title || "Collection"}
									fill
									className="object-cover transition-transform duration-700 group-hover:scale-105"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

								<div className="absolute bottom-0 left-0 p-8 md:p-12">
									<h3 className="font-serif text-3xl text-white md:text-4xl">{card.title}</h3>
									<p className="mt-2 text-lg font-light text-gray-200">{card.subtitle}</p>
									<div className="mt-6 inline-flex items-center gap-2 border-b border-terracotta pb-1 text-sm font-bold uppercase tracking-widest text-white transition-all group-hover:border-white">
										{card.ctaLabel || "Explore"}
									</div>
								</div>
							</Link>
						);
					})}
				</div>
			</div>
		</section>
	);
}
