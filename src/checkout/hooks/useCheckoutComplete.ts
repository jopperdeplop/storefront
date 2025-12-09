import { useMemo } from "react";
import { useCheckoutCompleteMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useSubmit } from "@/checkout/hooks/useSubmit";

export const useCheckoutComplete = () => {
	const {
		checkout: { id: checkoutId },
	} = useCheckout();
	const [{ fetching }, checkoutComplete] = useCheckoutCompleteMutation();

	const onCheckoutComplete = useSubmit<{}, typeof checkoutComplete>(
		useMemo(
			() => ({
				parse: () => ({
					checkoutId,
				}),
				onSubmit: checkoutComplete,
				onSuccess: () => {
					// Fix: Redirect to a generic success parameter to bypass backend race conditions
					const url = new URL(window.location.href);

					// Clear checkout state parameters
					url.searchParams.delete("checkout");
					url.searchParams.delete("payment_intent");
					url.searchParams.delete("redirect_status");

					// Set flag to show static success page
					url.searchParams.set("paymentSuccess", "true");

					// Force hard navigation
					window.location.href = url.toString();
				},
			}),
			[checkoutComplete, checkoutId],
		),
	);
	return { completingCheckout: fetching, onCheckoutComplete };
};
