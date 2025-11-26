import { Suspense, useMemo } from "react";
import { Checkout, CheckoutSkeleton } from "@/checkout/views/Checkout";
import { OrderConfirmation, OrderConfirmationSkeleton } from "@/checkout/views/OrderConfirmation";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { PaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";

export const RootViews = () => {
	const orderId = getQueryParams().orderId;

	// 1. Analyze URL Parameters
	const { isStripeSuccess, isStripeFailure, checkoutId } = useMemo(() => {
		if (typeof window === "undefined")
			return { isStripeSuccess: false, isStripeFailure: false, checkoutId: "" };

		const params = new URLSearchParams(window.location.search);
		return {
			isStripeSuccess: params.get("redirect_status") === "succeeded",
			isStripeFailure: params.get("redirect_status") === "failed",
			checkoutId: params.get("checkout") || "", // We need this to let them try again
		};
	}, []);

	// CASE A: Order Confirmed
	if (orderId) {
		return (
			<Suspense fallback={<OrderConfirmationSkeleton />}>
				<OrderConfirmation />
			</Suspense>
		);
	}

	// CASE B: Payment Successful
	if (isStripeSuccess) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-8 text-center">
				<div className="mb-8">
					<svg
						className="mx-auto h-16 w-16 text-terracotta"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 className="mb-4 font-serif text-4xl tracking-tight text-carbon">Payment Successful</h1>
				<p className="mx-auto mb-10 max-w-md font-sans leading-relaxed text-stone-600">
					We have received your payment. Your order is being processed and you will receive a confirmation
					email shortly.
				</p>
				{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
				<a
					href="/"
					className="inline-block rounded-sm bg-terracotta px-10 py-4 font-sans font-medium tracking-wide text-white shadow-sm transition-colors hover:bg-terracotta-dark"
				>
					Return to Store
				</a>
			</div>
		);
	}

	// CASE C: Payment Failed (New Addition)
	if (isStripeFailure) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-8 text-center">
				<div className="mb-8">
					{/* Warning Icon in Terracotta */}
					<svg
						className="mx-auto h-16 w-16 text-terracotta"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={1.5}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>

				<h1 className="mb-4 font-serif text-4xl tracking-tight text-carbon">Payment Failed</h1>

				<p className="mx-auto mb-10 max-w-md font-sans leading-relaxed text-stone-600">
					Unfortunately, your payment could not be processed. Please try again or use a different payment
					method.
				</p>

				{/* "Try Again" Button:
                   This links back to the Checkout URL *without* the failure status,
                   so the user can retry the payment.
                */}
				{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
				<a
					href={`/checkout?checkout=${checkoutId}`}
					className="inline-block rounded-sm bg-carbon px-10 py-4 font-sans font-medium tracking-wide text-white shadow-sm transition-colors hover:bg-gray-800"
				>
					Try Again
				</a>
			</div>
		);
	}

	// CASE D: Normal Checkout (Browsing)
	return (
		<PaymentProcessingScreen>
			<Suspense fallback={<CheckoutSkeleton />}>
				<Checkout />
			</Suspense>
		</PaymentProcessingScreen>
	);
};
