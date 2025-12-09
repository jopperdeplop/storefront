import { useEffect } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	const [{ data, fetching: loading }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		requestPolicy: "network-only", // Critical: Ensure we don't cache "null" results
	});

	// Polling logic: If order is missing, retry every 2s
	useEffect(() => {
		if (loading || data?.order) return;

		const intervalId = setInterval(() => {
			reexecuteQuery({ requestPolicy: "network-only" });
		}, 2000);

		return () => clearInterval(intervalId);
	}, [data, loading, reexecuteQuery]);

	return { order: data?.order as OrderFragment, loading };
};
