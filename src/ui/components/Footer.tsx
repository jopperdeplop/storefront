import Link from "next/link";
import Image from "next/image";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { ChannelsListDocument, MenuGetBySlugDocument } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export async function Footer({ channel }: { channel: string }) {
	const footerLinks = await executeGraphQL(MenuGetBySlugDocument, {
		variables: { slug: "footer", channel },
		revalidate: 60 * 60 * 24,
	});
	const channels = process.env.SALEOR_APP_TOKEN
		? await executeGraphQL(ChannelsListDocument, {
				withAuth: false,
				headers: {
					Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
				},
			})
		: null;
	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-gray-300 bg-vapor pb-8 pt-16 text-carbon">
			<div className="mx-auto max-w-[1920px] px-4 lg:px-8">
				{/* --- LINKS GRID --- */}
				<div className="mb-16 grid grid-cols-2 gap-8 md:grid-cols-4">
					{footerLinks.menu?.items?.map((item) => (
						<div key={item.id}>
							<h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-carbon">{item.name}</h3>
							<ul className="space-y-3">
								{item.children?.map((child) => {
									const label =
										child.category?.name || child.collection?.name || child.page?.title || child.name;
									// Logic to determine the correct href
									let href = child.url;
									if (child.category) href = `/categories/${child.category.slug}`;
									if (child.collection) href = `/collections/${child.collection.slug}`;
									if (child.page) href = `/pages/${child.page.slug}`;

									return (
										<li key={child.id}>
											<LinkWithChannel
												href={href || "/"}
												className="font-mono text-sm uppercase text-gray-500 decoration-cobalt underline-offset-4 transition-colors hover:text-cobalt hover:underline"
											>
												{label}
											</LinkWithChannel>
										</li>
									);
								})}
							</ul>
						</div>
					))}
				</div>

				{/* --- BOTTOM BAR --- */}
				<div className="flex flex-col items-start justify-between gap-6 border-t border-gray-300 pt-8 md:flex-row md:items-center">
					{/* Brand & Copyright */}
					<div className="flex flex-col gap-2">
						<span className="text-xl font-bold uppercase tracking-tighter">
							Salp<span className="text-cobalt">.</span>
						</span>
						<p className="font-mono text-xs uppercase tracking-wide text-gray-400">
							&copy; {currentYear} Salp Commerce Systems.
						</p>
					</div>

					{/* Currency & Credits */}
					<div className="flex flex-col gap-4 md:items-end">
						{channels?.channels && (
							<div className="text-sm">
								<span className="mr-2 font-mono uppercase text-gray-400">System Currency:</span>
								<ChannelSelect channels={channels.channels} />
							</div>
						)}

						<p className="flex items-center gap-2 font-mono text-xs uppercase text-gray-400">
							<span>System Architecture by</span>
							<Link target="_blank" href="https://saleor.io/" className="transition-colors hover:text-cobalt">
								Saleor
							</Link>
							<span className="text-gray-300">|</span>
							<Link
								href="https://github.com/saleor/saleor"
								target="_blank"
								className="opacity-50 transition-opacity hover:opacity-100"
							>
								<Image alt="GitHub" height={16} width={16} src="/github-mark.svg" />
							</Link>
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
