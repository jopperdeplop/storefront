import Link from "next/link";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";

export const metadata = {
	title: "Secure Checkout | Salp",
};

export default async function CheckoutPage(props: {
	searchParams: Promise<{ checkout?: string; order?: string }>;
}) {
	const searchParams = await props.searchParams;
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	if (!searchParams.checkout && !searchParams.order) {
		return null;
	}

	return (
		<div className="min-h-dvh bg-stone-50 text-gray-900 selection:bg-terracotta selection:text-white">
			<section className="mx-auto flex min-h-dvh max-w-[1920px] flex-col p-4 md:p-8">
				{/* --- HEADER: Salp Branding --- */}
				<header className="mb-10 flex items-center justify-between border-b border-stone-200 pb-6">
					<Link aria-label="homepage" href="/" className="group">
						<h1 className="font-serif text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
							Salp<span className="text-terracotta">.</span>
						</h1>
					</Link>
					<div className="hidden font-mono text-xs uppercase tracking-widest text-gray-400 md:block">
						Verified Secure Gateway
					</div>
				</header>

				{/* --- PAGE TITLE --- */}
				<h1 className="mb-8 font-serif text-3xl font-medium text-gray-900 md:text-4xl">Secure Checkout</h1>

				{/* --- CHECKOUT APP WRAPPER --- */}
				<section className="flex-1">
					<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
				</section>
			</section>
		</div>
	);
}
