"use client";

import Link from "next/link";
import Image from "next/image";

interface HeroBlockData {
	heading?: string;
	subtitle?: string;
	badge?: string;
	ctaPrimary?: { label?: string; url?: string };
	ctaSecondary?: { label?: string; url?: string };
	backgroundImage?: { url?: string; alt?: string };
}

interface HeroSectionProps {
	data: HeroBlockData;
	channel: string;
	locale: string;
}

export function HeroSection({ data, channel, locale }: HeroSectionProps) {
	const heroImageUrl =
		data.backgroundImage?.url || "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2500";

	return (
		<section className="relative h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-900 text-white">
			<div className="absolute inset-0 opacity-70">
				<Image
					src={heroImageUrl}
					alt={data.heading || "European Craftsmanship"}
					fill
					className="object-cover"
					priority
					fetchPriority="high"
				/>
			</div>
			<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

			<div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
				{data.badge && (
					<span className="mb-6 rounded-full border border-white/30 bg-white/10 px-4 py-1 font-mono text-xs font-medium uppercase tracking-[0.2em] backdrop-blur-md">
						{data.badge}
					</span>
				)}
				<h1 className="max-w-5xl font-serif text-6xl font-medium leading-tight tracking-tight md:text-8xl lg:text-9xl">
					{data.heading || "The European Standard."}
				</h1>
				{data.subtitle && (
					<p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-gray-100 md:text-xl">
						{data.subtitle}
					</p>
				)}

				<div className="mt-10 flex flex-col gap-4 sm:flex-row">
					{data.ctaPrimary?.label && (
						<Link
							href={`/${channel}/${locale}${data.ctaPrimary.url || "/products"}`}
							className="group relative overflow-hidden rounded-full bg-terracotta px-10 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-terracotta-dark"
						>
							<span className="relative z-10">{data.ctaPrimary.label}</span>
						</Link>
					)}
					{data.ctaSecondary?.label && (
						<Link
							href={data.ctaSecondary.url || "#story"}
							className="rounded-full border border-white/30 px-10 py-4 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-gray-900"
						>
							{data.ctaSecondary.label}
						</Link>
					)}
				</div>
			</div>
		</section>
	);
}
