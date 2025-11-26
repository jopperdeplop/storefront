import { Suspense } from "react";
// Removed "next/link" import to satisfy the strict architecture rule
import { Checkout, CheckoutSkeleton } from "@/checkout/views/Checkout";
import { OrderConfirmation, OrderConfirmationSkeleton } from "@/checkout/views/OrderConfirmation";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { PaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";
import { useCheckout } from "@/checkout/hooks/useCheckout";

export const RootViews = () => {
	const orderId = getQueryParams().orderId;

	const { isOrderFinalized } = useCheckout();

	if (orderId) {
		return (
			<Suspense fallback={<OrderConfirmationSkeleton />}>
				<OrderConfirmation />
			</Suspense>
		);
	}

	if (isOrderFinalized) {
		return (
			<div className="flex min-h-screen flex-col items-center justify-center bg-white p-8 text-center">
				<div className="mb-4">
					<svg
						className="mx-auto h-16 w-16 text-green-500"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h1 className="mb-2 text-2xl font-bold">Payment Successful</h1>
				<p className="mb-8 max-w-md text-gray-600">
					We have received your payment. Your order is being processed and you will receive a confirmation
					email shortly.
				</p>
				{/* We use a standard <a> tag to exit the Checkout app and return to the main store.
                   We disable the lint rule because we cannot use next/link here.
                */}
				{/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
				<a
					href="/"
					className="inline-block rounded bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
				>
					Return to Store
				</a>
			</div>
		);
	}

	return (
		<PaymentProcessingScreen>
			<Suspense fallback={<CheckoutSkeleton />}>
				<Checkout />
			</Suspense>
		</PaymentProcessingScreen>
	);
};
