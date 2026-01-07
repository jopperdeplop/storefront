import Link from "next/link";
import Image from "next/image";

interface BrandItem {
	id: string;
	title: string;
	slug: string;
	logo?: {
		value?: {
			url?: string;
		};
	};
}

interface BrandTickerBlockData {
	sectionLabel?: string;
}

interface BrandTickerSectionProps {
	data: BrandTickerBlockData;
	brands: BrandItem[];
}

export function BrandTickerSection({ data, brands }: BrandTickerSectionProps) {
	const brandItems = brands.filter((brand) => brand.logo?.value?.url);

	if (brandItems.length === 0) return null;

	return (
		<section className="overflow-hidden bg-stone-100 py-8 md:py-16">
			<div className="mx-auto mb-6 max-w-7xl px-4 text-center md:mb-10 md:px-8">
				<span className="font-mono text-xs uppercase tracking-[0.3em] text-gray-600">
					{data.sectionLabel || "Verified European Partners"}
				</span>
			</div>

			{/* Infinite Scroll Container */}
			<div className="relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
				<div className="animate-marquee flex whitespace-nowrap py-4">
					{[...brandItems, ...brandItems, ...brandItems].map((item, idx) => {
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
	);
}
