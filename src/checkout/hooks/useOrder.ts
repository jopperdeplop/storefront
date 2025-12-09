import { useEffect } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	const [{ data, fetching: loading }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		// Critical: Force a network request to bypass any stale 'null' result
		requestPolicy: "network-only",
	});

	// Polling logic:
	// If the query returns (loading=false) but the order is null (race condition),
	// we assume the webhook hasn't finished yet. We retry every 2 seconds.
	useEffect(() => {
		// Stop if we are loading or if we successfully found the order
		if (loading || data?.order) return;

		const intervalId = setInterval(() => {
			// Trigger a fresh network request
			reexecuteQuery({ requestPolicy: "network-only" });
		}, 2000);

		// Cleanup interval on unmount or when dependencies change
		return () => clearInterval(intervalId);
	}, [data, loading, reexecuteQuery]);

	return { order: data?.order as OrderFragment, loading };
};
