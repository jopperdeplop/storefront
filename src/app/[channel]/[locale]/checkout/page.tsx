import Link from "next/link";
import { invariant } from "ts-invariant";
import { RootWrapper } from "./pageWrapper";
import { CheckoutSuccessHandler } from "./CheckoutSuccessHandler";

export const metadata = {
	title: "Secure Checkout | Salp",
};

export default async function CheckoutPage(props: {
	searchParams: Promise<{ checkout?: string; order?: string; redirect_status?: string }>;
}) {
	const searchParams = await props.searchParams;
	invariant(process.env.NEXT_PUBLIC_SALEOR_API_URL, "Missing NEXT_PUBLIC_SALEOR_API_URL env variable");

	if (!searchParams.checkout && !searchParams.order && !searchParams.redirect_status) {
		return null;
	}

	// Check if we are in "Success Mode"
	const isOrderConfirmed = !!searchParams.order || searchParams.redirect_status === "succeeded";

	return (
		<div className="min-h-dvh bg-stone-50 text-gray-900 selection:bg-terracotta selection:text-white">
			<section className="mx-auto flex min-h-dvh max-w-[1920px] flex-col p-4 md:p-8">
				{/* --- HEADER --- */}
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

				{/* --- DYNAMIC CONTENT BLOCK --- */}
				{isOrderConfirmed ? (
					/* 1. SUCCESS VIEW (Replaces the broken Checkout App) */
					<div className="flex flex-1 flex-col items-center justify-center text-center">
						<CheckoutSuccessHandler />

						<div className="mb-6 text-terracotta">
							{/* Checkmark Icon */}
							<svg
								width="64"
								height="64"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
								<polyline points="22 4 12 14.01 9 11.01"></polyline>
							</svg>
						</div>

						<h1 className="mb-4 font-serif text-4xl text-gray-900">Payment Successful</h1>
						<p className="mb-8 max-w-md text-lg text-gray-600">
							We have received your payment. Your order is being processed and you will receive a confirmation
							email shortly.
						</p>

						<Link
							href="/"
							className="rounded bg-gray-900 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
						>
							Return to Store
						</Link>
					</div>
				) : (
					/* 2. CHECKOUT VIEW (Only show this if NOT confirmed) */
					<>
						<h1 className="mb-8 font-serif text-3xl font-medium text-gray-900 md:text-4xl">
							Secure Checkout
						</h1>
						<section className="flex-1">
							<RootWrapper saleorApiUrl={process.env.NEXT_PUBLIC_SALEOR_API_URL} />
						</section>
					</>
				)}
			</section>
		</div>
	);
}
