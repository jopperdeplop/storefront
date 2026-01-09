import { notFound } from "next/navigation";
import { type Metadata } from "next";
import { Suspense } from "react";
import edjsHTML from "editorjs-html";
import xss from "xss";
import { PageGetBySlugDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";
import { getBrandPageBySlug } from "@/lib/payload";
import { BrandPageRenderer } from "@/ui/components/BrandPageRenderer";
import { BrandProductShowcase } from "@/ui/components/BrandProductShowcase";

const parser = edjsHTML();

interface WithTranslation {
	translation?: {
		title?: string;
		content?: string;
	} | null;
}

export const generateMetadata = async (props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
}): Promise<Metadata> => {
	const params = await props.params;
	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: {
			slug: params.slug,
			locale: params.locale.toUpperCase() as LanguageCodeEnum,
		},
		revalidate: 60,
	});

	return {
		title: `${page?.seoTitle || page?.title || "Page"} · Saleor Storefront example`,
		description: page?.seoDescription || page?.seoTitle || page?.title,
	};
};

export default async function Page(props: {
	params: Promise<{ slug: string; channel: string; locale: string }>;
}) {
	const params = await props.params;
	const localeEnum = params.locale.toUpperCase() as LanguageCodeEnum;

	// 1. Fetch Page Content from Saleor
	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: {
			slug: params.slug,
			locale: localeEnum,
		},
		revalidate: 60,
	});

	if (!page) {
		notFound();
	}

	// 2. Check if this is a Brand page by checking pageType
	const isBrandPage = page.pageType?.slug === "brand" || page.pageType?.name?.toLowerCase() === "brand";

	// 3. If it's a brand page, try to fetch rich content from PayloadCMS
	if (isBrandPage) {
		const brandPage = await getBrandPageBySlug(params.slug, params.locale);

		if (brandPage && brandPage.layout && brandPage.layout.length > 0) {
			// Render rich brand page from PayloadCMS
			return (
				<>
					<BrandPageRenderer brandName={brandPage.brandName} layout={brandPage.layout} />
					<Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-12">Loading products...</div>}>
						<BrandProductShowcase brandSlug={params.slug} channel={params.channel} locale={params.locale} />
					</Suspense>
				</>
			);
		}
		// If PayloadCMS content not available, fall through to default Saleor rendering
	}

	// 4. Default Saleor page rendering
	const pageWithTranslation = page as typeof page & WithTranslation;
	const title = pageWithTranslation.translation?.title || page.title;
	const content = pageWithTranslation.translation?.content || page.content;

	let contentHtml: string[] | null = null;

	if (content) {
		try {
			const contentJson = JSON.parse(content) as { blocks?: unknown[] };
			if (contentJson && Array.isArray(contentJson.blocks) && contentJson.blocks.length > 0) {
				const parsed = parser.parse(contentJson);
				if (Array.isArray(parsed)) {
					contentHtml = parsed;
				}
			}
		} catch (e) {
			console.error("Failed to parse page content JSON", e);
		}
	}

	return (
		<div className="mx-auto max-w-7xl px-8 py-12">
			<header className="mb-12 text-center">
				<h1 className="text-5xl font-bold tracking-tight text-neutral-900">{title}</h1>
				{contentHtml && contentHtml.length > 0 && (
					<div className="prose prose-lg mx-auto mt-6 text-neutral-500">
						{contentHtml.map((htmlSnippet: string, index: number) => (
							<div key={index} dangerouslySetInnerHTML={{ __html: xss(htmlSnippet) }} />
						))}
					</div>
				)}
			</header>
		</div>
	);
}
