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
				onSuccess: ({ data }) => {
					const order = data.order;

					if (order) {
						// FIX: Use native URL API to manipulate params safely
						const url = new URL(window.location.href);

						// 1. Remove checkout ID to exit the checkout flow
						url.searchParams.delete("checkout");
						url.searchParams.delete("payment_intent"); // cleanup stripe params if any
						url.searchParams.delete("redirect_status");

						// 2. Add order ID to enter the confirmation flow
						url.searchParams.set("order", order.id);

						// 3. Force a hard navigation to the new URL
						window.location.href = url.toString();
					}
				},
			}),
			[checkoutComplete, checkoutId],
		),
	);
	return { completingCheckout: fetching, onCheckoutComplete };
};
