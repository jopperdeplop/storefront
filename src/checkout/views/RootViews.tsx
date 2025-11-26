import { Suspense, useMemo } from "react";
import { Checkout, CheckoutSkeleton } from "@/checkout/views/Checkout";
import { OrderConfirmation, OrderConfirmationSkeleton } from "@/checkout/views/OrderConfirmation";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { PaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { PageNotFound } from "@/checkout/views/PageNotFound";

export const RootViews = () => {
	// 1. Get Data from the Hook
	const { checkout, fetching } = useCheckout();
	const orderId = getQueryParams().orderId;

	// 2. Detect if we are returning from Stripe successfully
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

	// CASE B: THE FIX (Payment Success, but Checkout is gone)
	if (!fetching && !checkout && isStripeSuccess) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center">
				<div className="mb-6">
					<svg
						className="mx-auto h-20 w-20 text-green-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 className="mb-4 text-3xl font-bold">Payment Successful</h1>
				<p className="mx-auto mb-8 max-w-md text-gray-600">
					We have received your payment. Your order is being processed and you will receive a confirmation
					email shortly.
				</p>
				{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
				<a
					href="/"
					className="inline-block rounded bg-gray-900 px-8 py-3 font-medium text-white transition-colors hover:bg-gray-800"
				>
					Return to Store
				</a>
			</div>
		);
	}

	// CASE C: Error (No checkout, no success flag, not fetching)
	if (!fetching && !checkout) {
		return <PageNotFound />;
	}

	// CASE D: Normal Checkout (or Loading)
	return (
		<PaymentProcessingScreen>
			<Suspense fallback={<CheckoutSkeleton />}>
				<Checkout />
			</Suspense>
		</PaymentProcessingScreen>
	);
};
