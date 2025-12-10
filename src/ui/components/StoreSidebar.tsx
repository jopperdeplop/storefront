import { SidebarCategoryItem } from "./SidebarCategoryItem";
import { executeGraphQL } from "@/lib/graphql";
import { CategoriesListDocument, type LanguageCodeEnum } from "@/gql/graphql";

interface StoreSidebarProps {
	channel: string;
	locale: LanguageCodeEnum;
}

export async function StoreSidebar({ channel, locale }: StoreSidebarProps) {
	const { categories } = await executeGraphQL(CategoriesListDocument, {
		variables: {
			locale,
		},
		revalidate: 3600, // Cache for 1 hour
	});

	return (
		<aside className="hidden w-64 shrink-0 lg:block">
			<div className="sticky top-32 flex flex-col gap-10">
				{/* Categories */}
				{categories?.edges && categories.edges.length > 0 && (
					<div>
						<h3 className="mb-4 font-serif text-lg font-medium text-gray-900">Categories</h3>
						<ul className="space-y-3">
							{categories.edges.map(({ node: category }) => (
								<SidebarCategoryItem
									key={category.id}
									category={category}
									channel={channel}
									locale={locale}
								/>
							))}
						</ul>
					</div>
				)}
			</div>
		</aside>
	);
}
