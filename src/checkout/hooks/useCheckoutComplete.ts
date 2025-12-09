import { useMemo } from "react";
import { useCheckoutCompleteMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useSubmit } from "@/checkout/hooks/useSubmit";
import { getUrl } from "@/checkout/lib/utils/url"; // Changed from replaceUrl to getUrl

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
						// FIX: Use getUrl instead of replaceUrl.
						// replaceUrl pushes state immediately, causing the subsequent
						// window.location.href assignment to be ignored by the browser.
						const { newUrl } = getUrl({
							query: {
								order: order.id,
								checkout: undefined, // Explicitly clear checkout param
							},
							replaceWholeQuery: true,
						});

						// This will now trigger a proper hard reload
						window.location.href = newUrl;
					}
				},
			}),
			[checkoutComplete, checkoutId],
		),
	);
	return { completingCheckout: fetching, onCheckoutComplete };
};
