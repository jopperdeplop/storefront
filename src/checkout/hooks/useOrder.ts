import { useEffect } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	const [{ data, fetching: loading }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		requestPolicy: "network-only", // Bypass cache to avoid stuck "null" state
	});

	// Polling logic: If order is missing (race condition), retry every 2s
	useEffect(() => {
		// If we are currently loading, or if we found the order, do not poll
		if (loading || data?.order) return;

		// If data is null (backend hasn't created order yet), start polling
		const intervalId = setInterval(() => {
			reexecuteQuery({ requestPolicy: "network-only" });
		}, 2000);

		return () => clearInterval(intervalId);
	}, [data, loading, reexecuteQuery]);

	return { order: data?.order as OrderFragment, loading };
};
