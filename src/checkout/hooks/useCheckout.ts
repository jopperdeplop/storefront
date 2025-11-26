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

	useEffect(() => setLoadingCheckout(fetching || stale), [fetching, setLoadingCheckout, stale]);

	// --- NEW CODE START ---
	// 1. Check if the URL has the Stripe success flag
	const isPaymentSuccess = useMemo(() => {
		if (typeof window === "undefined") return false;
		const params = new URLSearchParams(window.location.search);
		return params.get("redirect_status") === "succeeded";
	}, []);

	// 2. Calculate the "Success" state
	// If the payment was successful, AND the checkout is gone (null), AND we aren't loading...
	// Then this is a completed order, not a missing page.
	const isOrderFinalized = isPaymentSuccess && !data?.checkout && !fetching;
	// --- NEW CODE END ---

	return useMemo(
		() => ({
			checkout: data?.checkout as Checkout,
			fetching: fetching || stale,
			isOrderFinalized, // We export this new flag to the view
			refetch,
		}),
		[data?.checkout, fetching, refetch, stale, isOrderFinalized],
	);
};
