import { Instagram, Youtube, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface BrandHeroBlock {
	blockType: "brand-hero";
	logo?: { url: string };
	coverImage?: { url: string };
	tagline?: string;
	instagramUrl?: string;
	youtubeUrl?: string;
}

interface BrandAboutBlock {
	blockType: "brand-about";
	heading?: string;
	story?: string;
	foundingYear?: number;
}

type BrandBlock = BrandHeroBlock | BrandAboutBlock;

interface BrandPageRendererProps {
	brandName: string;
	layout?: BrandBlock[];
}

const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL || "https://payload-saleor-payload.vercel.app";

function getAbsoluteUrl(url: string | undefined) {
	if (!url) return undefined;
	if (url.startsWith("http")) return url;
	return `${PAYLOAD_URL}${url}`;
}

function HeroSection({ block, brandName }: { block: BrandHeroBlock; brandName: string }) {
	const coverUrl = getAbsoluteUrl(block.coverImage?.url);
	const logoUrl = getAbsoluteUrl(block.logo?.url);

	return (
		<section className="relative overflow-hidden">
			{/* Cover Image with Parallax-like feel */}
			<div className="relative h-[300px] w-full md:h-[450px]">
				{coverUrl ? (
					<Image
						src={coverUrl}
						alt={`${brandName} cover`}
						fill
						className="object-cover transition-transform duration-700 hover:scale-105"
						priority
					/>
				) : (
					<div className="size-full bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
				)}
				<div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
			</div>

			<div className="relative mx-auto -mt-32 max-w-7xl px-4 pb-12 md:-mt-40">
				<div className="flex flex-col items-center text-center">
					{/* Logo with premium border */}
					<div className="relative mb-6 size-32 overflow-hidden rounded-2xl border-[6px] border-white bg-white shadow-2xl md:size-40">
						{logoUrl ? (
							<Image src={logoUrl} alt={`${brandName} logo`} fill className="object-cover" />
						) : (
							<div className="flex size-full items-center justify-center bg-neutral-50 text-neutral-300">
								<ImageIcon className="size-12" />
							</div>
						)}
					</div>

					{/* Brand Identity */}
					<h1 className="font-serif text-4xl font-bold tracking-tight text-neutral-900 md:text-6xl">
						{brandName}
					</h1>

					{block.tagline && (
						<p className="mt-4 max-w-2xl text-xl font-medium text-neutral-600 md:text-2xl">{block.tagline}</p>
					)}

					{/* Social Cluster */}
					{(block.instagramUrl || block.youtubeUrl) && (
						<div className="mt-8 flex flex-wrap justify-center gap-4">
							{block.instagramUrl && (
								<a
									href={block.instagramUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-md ring-1 ring-neutral-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
								>
									<span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white">
										<Instagram className="size-4" />
									</span>
									Instagram
								</a>
							)}
							{block.youtubeUrl && (
								<a
									href={block.youtubeUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="group flex items-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-semibold text-neutral-900 shadow-md ring-1 ring-neutral-200 transition-all hover:-translate-y-0.5 hover:shadow-xl"
								>
									<span className="flex size-8 items-center justify-center rounded-full bg-[#FF0000] text-white">
										<Youtube className="size-4" />
									</span>
									YouTube
								</a>
							)}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

function AboutSection({ block }: { block: BrandAboutBlock }) {
	return (
		<section className="mx-auto max-w-7xl px-4 py-20">
			<div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
				<div>
					<h2 className="font-serif text-3xl font-bold text-neutral-900 md:text-4xl">
						{block.heading || "Our Story"}
					</h2>
					<div className="mt-4 h-1.5 w-20 rounded-full bg-neutral-900" />
				</div>

				<div className="max-w-prose">
					{block.story && (
						<div className="space-y-6 text-lg leading-relaxed text-neutral-600">
							{block.story.split("\n").map((line, index) => (
								<p key={index}>{line}</p>
							))}
						</div>
					)}

					{block.foundingYear && (
						<div className="mt-10 flex items-center gap-4 border-t border-neutral-100 pt-8">
							<div className="flex size-12 items-center justify-center rounded-xl bg-neutral-50 font-serif text-xl font-bold text-neutral-900">
								{String(block.foundingYear).slice(0, 2)}
							</div>
							<div>
								<p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
									Legacy Established
								</p>
								<p className="text-lg font-bold text-neutral-900">{block.foundingYear}</p>
							</div>
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

export function BrandPageRenderer({ brandName, layout }: BrandPageRendererProps) {
	const heroBlock = layout?.find((block) => block.blockType === "brand-hero") as BrandHeroBlock | undefined;
	const aboutBlock = layout?.find((block) => block.blockType === "brand-about") as
		| BrandAboutBlock
		| undefined;

	return (
		<main className="min-h-screen bg-white selection:bg-neutral-900 selection:text-white">
			{heroBlock && <HeroSection block={heroBlock} brandName={brandName} />}
			<div className="h-px w-full bg-neutral-100" />
			{aboutBlock && <AboutSection block={aboutBlock} />}
		</main>
	);
}
