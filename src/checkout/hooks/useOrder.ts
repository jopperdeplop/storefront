import { useEffect } from "react";
import { type OrderFragment, useOrderQuery } from "@/checkout/graphql";
import { getQueryParams } from "@/checkout/lib/utils/url";

export const useOrder = () => {
	const { orderId } = getQueryParams();

	const [{ data, fetching: loading, error }, reexecuteQuery] = useOrderQuery({
		pause: !orderId,
		variables: { languageCode: "EN_US", id: orderId as string },
		requestPolicy: "network-only",
	});

	useEffect(() => {
		// Stop polling if we have data or a hard error
		if (loading || data?.order || error) return;

		// Poll if data is missing but no error yet (race condition)
		const intervalId = setInterval(() => {
			reexecuteQuery({ requestPolicy: "network-only" });
		}, 2000);

		return () => clearInterval(intervalId);
	}, [data, loading, error, reexecuteQuery]);

	// Return error so the view can handle it
	return { order: data?.order as OrderFragment, loading, error };
};
