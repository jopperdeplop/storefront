/* eslint-disable */
"use client";

import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useEffect, useMemo } from "react";
import { apiErrorMessages } from "../errorMessages";
import { CheckoutForm } from "./stripeElementsForm";
import { useTransactionInitializeMutation } from "@/checkout/graphql";
import { useAlerts } from "@/checkout/hooks/useAlerts";
import { useErrorMessages } from "@/checkout/hooks/useErrorMessages";
import { useCheckout } from "@/checkout/hooks/useCheckout";

interface StripeComponentProps {
	config: {
		id: string;
		data?: any;
		config?: any[];
	};
}

export const StripeComponent = ({ config }: StripeComponentProps) => {
	const { checkout } = useCheckout();
	const [transactionInitializeResult, transactionInitialize] = useTransactionInitializeMutation();

	// 1. Parse Data with Fallback Logic
	const stripeData = useMemo(() => {
		const rawData = transactionInitializeResult.data?.transactionInitialize?.data as any;

		// Fallback: If the transaction request is slow or failed, try to get the key
		// from the 'config' prop which we already received successfully.
		const fallbackKey =
			(config as any)?.data?.stripePublishableKey ||
			(Array.isArray(config?.config)
				? config.config.find((i: any) => i.field === "api_key")?.value
				: undefined);

		// If we have neither new data nor a fallback key, we can't do anything.
		if (!rawData && !fallbackKey) return undefined;

		return {
			paymentIntent: rawData?.paymentIntent,
			// Prioritize the fresh key from transaction, but accept the fallback
			publishableKey: rawData?.stripePublishableKey || rawData?.publishableKey || fallbackKey,
		};
	}, [transactionInitializeResult.data, config]);

	const { showCustomErrors } = useAlerts();
	const { errorMessages: commonErrorMessages } = useErrorMessages(apiErrorMessages);

	useEffect(() => {
		const gatewayId = config?.id || "saleor.app.payment.stripe";

		transactionInitialize({
			checkoutId: checkout.id,
			paymentGateway: {
				id: gatewayId,
				data: {
					// 2. CRITICAL FIX: Wrap the config in 'paymentIntent' object
					// This matches the schema expected by the Saleor Stripe App
					paymentIntent: {
						automatic_payment_methods: {
							enabled: true,
						},
					},
				},
			},
		}).catch((err) => {
			console.error("Stripe Transaction Init Failed:", err);
			showCustomErrors([{ message: commonErrorMessages.somethingWentWrong }]);
		});
	}, [
		checkout.id,
		config?.id,
		commonErrorMessages.somethingWentWrong,
		showCustomErrors,
		transactionInitialize,
	]);

	const stripePromise = useMemo(
		() => stripeData?.publishableKey && loadStripe(stripeData.publishableKey),
		[stripeData],
	);

	// Wait until we have both the Stripe Library loaded AND the Client Secret from the server
	if (!stripePromise || !stripeData?.paymentIntent?.client_secret) {
		return null;
	}

	return (
		<Elements
			options={{ clientSecret: stripeData.paymentIntent.client_secret, appearance: { theme: "stripe" } }}
			stripe={stripePromise}
		>
			<CheckoutForm />
		</Elements>
	);
};
