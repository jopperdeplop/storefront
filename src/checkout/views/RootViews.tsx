import { Suspense, useMemo } from "react";
import { Checkout, CheckoutSkeleton } from "@/checkout/views/Checkout";
import { OrderConfirmation, OrderConfirmationSkeleton } from "@/checkout/views/OrderConfirmation";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { PaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";

export const RootViews = () => {
	const orderId = getQueryParams().orderId;

	// 1. Detect if we are returning from Stripe successfully
	const isStripeSuccess = useMemo(() => {
		if (typeof window === "undefined") return false;
		const params = new URLSearchParams(window.location.search);
		return params.get("redirect_status") === "succeeded";
	}, []);

	// CASE A: We have an Order ID (Standard success flow)
	if (orderId) {
		return (
			<Suspense fallback={<OrderConfirmationSkeleton />}>
				<OrderConfirmation />
			</Suspense>
		);
	}

	// CASE B: Payment Success (Styled with your Euro-Standard Palette)
	if (isStripeSuccess) {
		return (
			// Changed: bg-white -> bg-stone-50 (Editorial background)
			<div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-8 text-center">
				<div className="mb-8">
					{/* Changed: text-green-500 -> text-terracotta (Brand Color) */}
					<svg
						className="mx-auto h-16 w-16 text-terracotta"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
					</svg>
				</div>

				{/* Changed: font-bold -> font-serif (Times New Roman), text-carbon */}
				<h1 className="mb-4 font-serif text-4xl tracking-tight text-carbon">Payment Successful</h1>

				{/* Changed: font-sans added for body text consistency */}
				<p className="mx-auto mb-10 max-w-md font-sans leading-relaxed text-stone-600">
					We have received your payment. Your order is being processed and you will receive a confirmation
					email shortly.
				</p>

				{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
				<a
					href="/"
					// Changed: bg-gray-900 -> bg-terracotta, added hover:bg-terracotta-dark
					className="inline-block rounded-sm bg-terracotta px-10 py-4 font-sans font-medium tracking-wide text-white shadow-sm transition-colors hover:bg-terracotta-dark"
				>
					Return to Store
				</a>
			</div>
		);
	}

	// CASE C: Normal Checkout (Browsing/Editing Cart)
	return (
		<PaymentProcessingScreen>
			<Suspense fallback={<CheckoutSkeleton />}>
				<Checkout />
			</Suspense>
		</PaymentProcessingScreen>
	);
};
