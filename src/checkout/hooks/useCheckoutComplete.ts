import { useMemo } from "react";
import { useCheckoutCompleteMutation } from "@/checkout/graphql";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { useSubmit } from "@/checkout/hooks/useSubmit";
import { replaceUrl } from "@/checkout/lib/utils/url";

export const useCheckoutComplete = ({ id }: { id?: string } = {}) => {
	const { checkout } = useCheckout();
	const checkoutId = id || checkout?.id;
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
						const newUrl = replaceUrl({
							query: {
								order: order.id,
							},
							replaceWholeQuery: true,
						});
						window.location.href = newUrl;
					}
				},
			}),
			[checkoutComplete, checkoutId],
		),
	);
	return { completingCheckout: fetching, onCheckoutComplete };
};
