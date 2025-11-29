import { type ReactNode } from "react";
import { Footer } from "@/ui/components/Footer";
import { Header } from "@/ui/components/Header";

export const metadata = {
	title: "Saleor Storefront example",
	description: "Starter pack for building performant e-commerce experiences with Saleor.",
};

export default async function RootLayout(props: {
	children: ReactNode;
	params: Promise<{ channel: string; locale: string }>;
}) {
	const params = await props.params;
	const { channel, locale } = params;

	return (
		<>
			{/* Note: Ensure Header is updated to accept locale if it uses NavLinks */}
			<Header channel={channel} locale={locale} />
			<div className="flex min-h-[calc(100dvh-64px)] flex-col">
				<main className="flex-1">{props.children}</main>
				<Footer channel={channel} locale={locale} />
			</div>
		</>
	);
}
