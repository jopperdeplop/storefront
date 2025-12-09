import { useEffect } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	const [{ data, fetching: loading }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		requestPolicy: "network-only", //
	});

	// Polling logic: Retry every 1s if order is missing
	useEffect(() => {
		if (loading) return;

		if (!data?.order) {
			const intervalId = setInterval(() => {
				reexecuteQuery({ requestPolicy: "network-only" });
			}, 1000);

			return () => clearInterval(intervalId);
		}
	}, [data, loading, reexecuteQuery]);

	return { order: data?.order as OrderFragment, loading };
};
