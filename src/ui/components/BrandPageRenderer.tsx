import { Instagram, Youtube } from "lucide-react";
import Image from "next/image";

interface BrandHeroBlock {
	blockType: "brand-hero";
	logo?: { url: string };
	coverImage?: { url: string };
	tagline?: string;
	socialLinks?: {
		instagram?: string;
		youtube?: string;
	};
}

interface BrandAboutBlock {
	blockType: "brand-about";
	heading?: string;
	story?: { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } };
	foundingYear?: number;
	images?: Array<{ image?: { url: string }; caption?: string }>;
}

type BrandBlock = BrandHeroBlock | BrandAboutBlock;

interface BrandPageRendererProps {
	brandName: string;
	layout: BrandBlock[];
}

function HeroSection({ block, brandName }: { block: BrandHeroBlock; brandName: string }) {
	return (
		<section className="relative">
			{/* Cover Image */}
			{block.coverImage?.url && (
				<div className="relative h-64 w-full overflow-hidden md:h-96">
					<Image
						src={block.coverImage.url}
						alt={`${brandName} cover`}
						fill
						className="object-cover"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
				</div>
			)}

			<div className="relative mx-auto max-w-7xl px-4 py-8 md:py-12">
				<div className="flex flex-col items-center text-center">
					{/* Logo */}
					{block.logo?.url && (
						<div className="relative -mt-16 mb-4 size-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg md:-mt-20 md:size-32">
							<Image src={block.logo.url} alt={`${brandName} logo`} fill className="object-cover" />
						</div>
					)}

					{/* Brand Name */}
					<h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-5xl">{brandName}</h1>

					{/* Tagline */}
					{block.tagline && <p className="mt-4 text-lg text-neutral-600 md:text-xl">{block.tagline}</p>}

					{/* Social Links */}
					{(block.socialLinks?.instagram || block.socialLinks?.youtube) && (
						<div className="mt-6 flex gap-4">
							{block.socialLinks.instagram && (
								<a
									href={block.socialLinks.instagram}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
								>
									<Instagram className="size-4" />
									Instagram
								</a>
							)}
							{block.socialLinks.youtube && (
								<a
									href={block.socialLinks.youtube}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
								>
									<Youtube className="size-4" />
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
	// Extract plain text from Lexical rich text format
	const getStoryText = (): string => {
		if (!block.story?.root?.children) return "";
		return block.story.root.children
			.map((paragraph) => paragraph.children?.map((child) => child.text || "").join("") || "")
			.filter(Boolean)
			.join("\n\n");
	};

	const storyText = getStoryText();

	return (
		<section className="mx-auto max-w-7xl px-4 py-12 md:py-16">
			<h2 className="mb-8 text-2xl font-bold text-neutral-900 md:text-3xl">{block.heading || "About Us"}</h2>

			<div className="grid gap-8 md:grid-cols-2">
				<div>
					{storyText && (
						<div className="prose prose-lg text-neutral-600">
							{storyText.split("\n\n").map((paragraph, index) => (
								<p key={index}>{paragraph}</p>
							))}
						</div>
					)}

					{block.foundingYear && (
						<p className="mt-6 text-sm text-neutral-500">
							Established in <span className="font-semibold">{block.foundingYear}</span>
						</p>
					)}
				</div>

				{/* Images Gallery */}
				{block.images && block.images.length > 0 && (
					<div className="grid grid-cols-2 gap-4">
						{block.images.slice(0, 4).map((item, index) => (
							<div key={index} className="relative aspect-square overflow-hidden rounded-lg">
								{item.image?.url && (
									<Image
										src={item.image.url}
										alt={item.caption || `Brand image ${index + 1}`}
										fill
										className="object-cover transition-transform hover:scale-105"
									/>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}

export function BrandPageRenderer({ brandName, layout }: BrandPageRendererProps) {
	const heroBlock = layout.find((block) => block.blockType === "brand-hero") as BrandHeroBlock | undefined;
	const aboutBlock = layout.find((block) => block.blockType === "brand-about") as BrandAboutBlock | undefined;

	return (
		<div className="min-h-screen bg-white">
			{heroBlock && <HeroSection block={heroBlock} brandName={brandName} />}
			{aboutBlock && <AboutSection block={aboutBlock} />}
		</div>
	);
}
