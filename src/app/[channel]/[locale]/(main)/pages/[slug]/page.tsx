import { notFound } from "next/navigation";
import { type Metadata } from "next";
import edjsHTML from "editorjs-html";
import xss from "xss";
import { PageGetBySlugDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

const parser = edjsHTML();

// --- FIX: Safe Type Extension for Translations ---
interface WithTranslation {
	translation?: {
		title?: string;
		content?: string;
	} | null;
}
// ------------------------------------------------

export const generateMetadata = async (props: {
	params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> => {
	const params = await props.params;
	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: {
			slug: params.slug,
			// UPDATED: Include locale
			locale: params.locale.toUpperCase() as LanguageCodeEnum,
		},
		revalidate: 60,
	});

	return {
		title: `${page?.seoTitle || page?.title || "Page"} · Saleor Storefront example`,
		description: page?.seoDescription || page?.seoTitle || page?.title,
	};
};

export default async function Page(props: { params: Promise<{ slug: string; locale: string }> }) {
	const params = await props.params;
	const { page } = await executeGraphQL(PageGetBySlugDocument, {
		variables: {
			slug: params.slug,
			// UPDATED: Include locale
			locale: params.locale.toUpperCase() as LanguageCodeEnum,
		},
		revalidate: 60,
	});

	if (!page) {
		notFound();
	}

	// --- FIX: Safe Type Casting ---
	const pageWithTranslation = page as typeof page & WithTranslation;

	const title = pageWithTranslation.translation?.title || page.title;
	const content = pageWithTranslation.translation?.content || page.content;

	// Note: 'content' is now strictly typed as string | null | undefined,
	// so JSON.parse(content) is safe when content is truthy.
	// We explicitly cast the result of parser.parse to string[] to satisfy strict linting if necessary,
	// though usually edjsHTML returns string[].
	const contentHtml = content ? (parser.parse(JSON.parse(content)) ) : null;

	return (
		<div className="mx-auto max-w-7xl p-8 pb-16">
			<h1 className="text-3xl font-semibold">{title}</h1>
			{contentHtml && (
				<div className="prose">
					{contentHtml.map((htmlSnippet: string) => (
						<div key={htmlSnippet} dangerouslySetInnerHTML={{ __html: xss(htmlSnippet) }} />
					))}
				</div>
			)}
		</div>
	);
}
