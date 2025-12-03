import { notFound } from "next/navigation";
import { type Metadata } from "next";
import edjsHTML from "editorjs-html";
import xss from "xss";
import { PageGetBySlugDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

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

	// 1. Fetch Page Content
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
