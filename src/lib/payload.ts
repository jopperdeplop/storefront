const PAYLOAD_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL || "https://payload-saleor-payload.vercel.app";

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

export interface PayloadBrandPage {
	id: string;
	vendorId: string;
	saleorPageSlug: string;
	brandName: string;
	translationHash?: string;
	layout?: BrandBlock[];
	createdAt: string;
	updatedAt: string;
}

/**
 * Fetch a brand page from PayloadCMS by its Saleor page slug
 */
export async function getBrandPageBySlug(slug: string, locale?: string): Promise<PayloadBrandPage | null> {
	try {
		const localeParam = locale ? `&locale=${locale}` : "";
		const response = await fetch(
			`${PAYLOAD_URL}/api/brand-pages?where[saleorPageSlug][equals]=${slug}&limit=1${localeParam}`,
			{
				next: { revalidate: 60 },
			},
		);

		if (!response.ok) {
			console.error("PayloadCMS error:", response.status);
			return null;
		}

		const data = (await response.json()) as { docs: PayloadBrandPage[] };
		return data.docs[0] || null;
	} catch (error) {
		console.error("Failed to fetch brand page from PayloadCMS:", error);
		return null;
	}
}
