import { useEffect, useState } from "react";
import { useCheckoutCompleteMutation } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";
import { Title } from "@/checkout/components";
import { Button } from "@/checkout/components/Button";
import { usePaymentProcessingScreen } from "@/checkout/sections/PaymentSection/PaymentProcessingScreen";

export const PostPaymentHandling = () => {
	const { checkoutId } = getQueryParams();
	const [, checkoutComplete] = useCheckoutCompleteMutation();
	const { setIsProcessingPayment } = usePaymentProcessingScreen();
	const [error, setError] = useState(false);

	useEffect(() => {
		const handleCompletion = async () => {
			if (!checkoutId || typeof checkoutId !== "string") {
				setIsProcessingPayment(false);
				setError(true);
				return;
			}

			try {
				const result = await checkoutComplete({ checkoutId });
				const { data, error: mutationError } = result;

				if (mutationError || data?.checkoutComplete?.errors?.length) {
					// Checkout probably gone or errors. Show success message as fallback
					setIsProcessingPayment(false);
					setError(true);
				} else if (data?.checkoutComplete?.order) {
					// Success! Redirect to order page
					const orderId = data.checkoutComplete.order.id;
					const newUrl = new URL(window.location.href);
					newUrl.searchParams.delete("checkout");
					newUrl.searchParams.delete("processingPayment");
					newUrl.searchParams.delete("payment_intent");
					newUrl.searchParams.delete("payment_intent_client_secret");
					// Saleor storefront usually uses ?orderId=...
					newUrl.searchParams.set("order", orderId);
					window.location.href = newUrl.toString();
				} else {
					// Weird state, no order returned but no error?
					setIsProcessingPayment(false);
					setError(true);
				}
			} catch (e) {
				// Network error or other
				setIsProcessingPayment(false);
				setError(true);
			}
		};

		void handleCompletion();
	}, [checkoutId, checkoutComplete, setIsProcessingPayment]);

	if (error) {
		return (
			<div className="flex h-screen w-full flex-col items-center justify-center p-8 text-center">
				<Title className="mb-4 text-2xl">Order Confirmed</Title>
				<p className="mb-8 text-lg">
					Thank you for your payment. We received your order and are processing it.
					<br />
					Please check your email for the order confirmation details.
				</p>
				<Button
					className="w-auto px-8"
					label="Continue Shopping"
					ariaLabel="Go back to store"
					onClick={() => (window.location.href = "/")}
				/>
			</div>
		);
	}

	return null;
};
