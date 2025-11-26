import { useEffect, useMemo } from "react";

import { type Checkout, useCheckoutQuery } from "@/checkout/graphql";
import { extractCheckoutIdFromUrl } from "@/checkout/lib/utils/url";
import { useCheckoutUpdateStateActions } from "@/checkout/state/updateStateStore";

export const useCheckout = ({ pause = false } = {}) => {
	const id = useMemo(() => extractCheckoutIdFromUrl(), []);
	const { setLoadingCheckout } = useCheckoutUpdateStateActions();

	const [{ data, fetching, stale }, refetch] = useCheckoutQuery({
		variables: { id, languageCode: "EN_US" },
		pause: pause,
	});

	// --- FIX START ---

	// 1. Detect if we are returning from a Payment Gateway
	// We check the URL for 'redirect_status' (Stripe standard) or 'processingPayment' flag.
	const isPaymentRedirect = useMemo(() => {
		if (typeof window === "undefined") return false;
		const params = new URLSearchParams(window.location.search);
		return params.has("redirect_status") || params.has("processingPayment");
	}, []);

	// 2. Determine "Artificial" Loading State
	// If we are in a redirect flow AND the checkout is missing (null), it means the
	// backend likely already converted it to an Order.
	// We force the state to look like it is still "fetching" to prevent the Error Screen.
	const isTransitioningToOrder = isPaymentRedirect && !data?.checkout;

	// 3. Combine real fetching with our artificial wait
	const isActuallyFetching = fetching || stale || isTransitioningToOrder;

	// --- FIX END ---

	useEffect(() => {
		setLoadingCheckout(isActuallyFetching);
	}, [isActuallyFetching, setLoadingCheckout]);

	return useMemo(
		() => ({
			checkout: data?.checkout as Checkout,
			fetching: isActuallyFetching, // Return our "safe" fetching state
			refetch,
		}),
		[data?.checkout, isActuallyFetching, refetch],
	);
};
