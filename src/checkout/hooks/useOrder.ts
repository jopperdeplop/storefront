import { useEffect } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	const [{ data, fetching: loading }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		requestPolicy: "network-only", // Bypasses client cache
	});

	// Polling logic: Retry every 2s if order is missing (e.g. race condition)
	useEffect(() => {
		if (loading) return;

		// If data is returned but order is null, backend is still processing
		if (!data?.order) {
			const intervalId = setInterval(() => {
				// Re-execute without overwriting context (preserves Auth headers)
				reexecuteQuery({ requestPolicy: "network-only" });
			}, 2000);

			return () => clearInterval(intervalId);
		}
	}, [data, loading, reexecuteQuery]);

	return { order: data?.order as OrderFragment, loading };
};
