import Link from "next/link";
import Image from "next/image";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import { ChannelSelect } from "./ChannelSelect";
import { ChannelsListDocument, MenuGetBySlugDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export async function Footer({ channel, locale }: { channel: string; locale: string }) {
	let footerLinks = null;
	let channels = null;

	try {
		const footerPromise = executeGraphQL(MenuGetBySlugDocument, {
			variables: {
				slug: "footer",
				channel,
				locale: locale.toUpperCase() as LanguageCodeEnum,
			},
			revalidate: 60 * 60 * 24,
		});

		const channelsPromise = process.env.SALEOR_APP_TOKEN
			? executeGraphQL(ChannelsListDocument, {
					withAuth: false,
					headers: {
						Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
					},
				})
			: Promise.resolve(null);

		const [footerResult, channelsResult] = await Promise.all([footerPromise, channelsPromise]);
		footerLinks = footerResult;
		channels = channelsResult;
	} catch (error) {
		console.error("Failed to fetch Footer data:", error);
		// We continue rendering the static parts of the footer even if API fails
	}

	const currentYear = new Date().getFullYear();

	return (
		<footer className="border-t border-gray-200 bg-stone-100 pb-12 pt-20 text-gray-900">
			<div className="mx-auto max-w-[1920px] px-4 lg:px-8">
				{/* --- LINKS GRID --- */}
				<div className="mb-20 grid grid-cols-2 gap-12 md:grid-cols-4">
					{footerLinks?.menu?.items?.map((item) => (
						<div key={item.id}>
							<h3 className="mb-6 font-serif text-lg font-medium text-gray-900">{item.name}</h3>
							<ul className="space-y-4">
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
												className="text-sm text-gray-500 decoration-terracotta underline-offset-4 transition-colors hover:text-terracotta hover:underline"
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

				{/* --- TRUST SIGNALS  --- */}
				<div className="mb-12 border-b border-gray-200 pb-8">
					<p className="mb-4 font-mono text-xs uppercase tracking-widest text-gray-400">
						Verified European Logistics & Payment
					</p>
					<div className="flex flex-wrap gap-4 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
						{/* CSS-based Badges to represent logos cleanly without external assets */}
						<div className="flex h-8 items-center border border-gray-300 bg-white px-3 text-[10px] font-bold tracking-widest text-gray-600">
							DHL
						</div>
						<div className="flex h-8 items-center border border-gray-300 bg-white px-3 text-[10px] font-bold tracking-widest text-gray-600">
							POSTNL
						</div>
						<div className="flex h-8 items-center border border-gray-300 bg-white px-3 text-[10px] font-bold tracking-widest text-[#FFB3C7]">
							KLARNA
						</div>
						<div className="flex h-8 items-center border border-gray-300 bg-white px-3 text-[10px] font-bold tracking-widest text-[#635BFF]">
							STRIPE
						</div>
						<div className="flex h-8 items-center border border-gray-300 bg-white px-3 text-[10px] font-bold tracking-widest text-gray-600">
							IDEAL
						</div>
					</div>
				</div>

				{/* --- BOTTOM BAR --- */}
				<div className="flex flex-col items-start justify-between gap-6 pt-4 md:flex-row md:items-center">
					{/* Brand & Copyright */}
					<div className="flex flex-col gap-2">
						<span className="font-serif text-2xl font-bold leading-none text-gray-900">
							Salp<span className="text-terracotta">.</span>
						</span>
						<p className="font-mono text-xs text-gray-500">&copy; {currentYear} • Quality as a Service.</p>
					</div>

					{/* Currency & Credits */}
					<div className="flex flex-col gap-4 md:items-end">
						{channels?.channels && (
							<div className="text-sm">
								<span className="mr-2 font-mono text-xs uppercase text-gray-400">Region:</span>
								<ChannelSelect channels={channels.channels} />
							</div>
						)}

						<p className="flex items-center gap-2 font-mono text-xs uppercase text-gray-400">
							<span>Powered by</span>
							<Link
								target="_blank"
								href="https://saleor.io/"
								className="font-bold text-gray-600 hover:text-terracotta"
							>
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
