import { useEffect, useMemo } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	// Define cache-busting context to force Vercel/Next.js to fetch fresh data
	const queryContext = useMemo(
		() => ({
			fetchOptions: {
				cache: "no-store" as const, // Next.js specific: disables Data Cache
				headers: {
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			},
		}),
		[],
	);

	const [{ data, fetching: loading }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		requestPolicy: "network-only",
		context: queryContext,
	});

	// Polling logic: Retry every 2s if order is missing
	useEffect(() => {
		// If we are currently loading, do nothing
		if (loading) return;

		// If data returned but order is null, we need to poll
		if (!data?.order) {
			const intervalId = setInterval(() => {
				reexecuteQuery({
					requestPolicy: "network-only",
					// re-apply context to ensure polling requests also bypass cache
					context: queryContext,
				});
			}, 2000);

			return () => clearInterval(intervalId);
		}
	}, [data, loading, reexecuteQuery, queryContext]);

	return { order: data?.order as OrderFragment, loading };
};
