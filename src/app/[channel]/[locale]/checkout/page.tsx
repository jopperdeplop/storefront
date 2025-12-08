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

	// Guard clause: Ensure we have at least a checkout ID or an order ID before rendering
	if (!searchParams.checkout && !searchParams.order && !searchParams.redirect_status) {
		return null;
	}

	// STRICT CHECK: Are we successful?
	const isSuccess = !!searchParams.order || searchParams.redirect_status === "succeeded";

	return (
		<div className="min-h-dvh bg-stone-50 text-gray-900 selection:bg-terracotta selection:text-white">
			<section className="mx-auto flex min-h-dvh max-w-[1920px] flex-col p-4 md:p-8">
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

				{isSuccess ? (
					/* SUCCESS MODE */
					<div className="flex flex-1 flex-col items-center justify-center text-center">
						<CheckoutSuccessHandler />
						<h1 className="mb-4 font-serif text-4xl text-gray-900">Payment Successful</h1>
						<p className="mb-8 max-w-md text-lg text-gray-600">Thank you. Your order has been confirmed.</p>
						<Link href="/" className="rounded bg-gray-900 px-8 py-3 text-sm font-medium text-white">
							Return to Store
						</Link>
					</div>
				) : (
					/* CHECKOUT MODE */
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
