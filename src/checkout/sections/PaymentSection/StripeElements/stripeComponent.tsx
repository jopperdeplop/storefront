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

	const stripeData = useMemo(() => {
		const rawData = transactionInitializeResult.data?.transactionInitialize?.data as any;

		if (!rawData) return undefined;

		const intent = rawData.paymentIntent || {};

		// FALLBACK LOGIC:
		// The transaction response didn't return the key, so we grab it from the 'config' prop
		// which successfully received it during the previous initialization step.
		const configData = config?.data || {};
		const fallbackKey = configData.stripePublishableKey || configData.publishableKey;

		return {
			paymentIntent: {
				...intent,
				// Map the App's response name to what Stripe Elements expects
				client_secret: intent.client_secret || intent.stripeClientSecret,
			},
			// Try transaction data first, then fall back to config data
			publishableKey: rawData.stripePublishableKey || rawData.publishableKey || fallbackKey,
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
					paymentIntent: {
						// "card" triggers the correct flow in the Saleor App
						paymentMethod: "card",
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

	// Rendering Gate: Now we have the Secret (from Transaction) AND the Key (from Config)
	if (!stripePromise || !stripeData?.paymentIntent?.client_secret) {
		return null;
	}

	return (
		<Elements
			options={{
				clientSecret: stripeData.paymentIntent.client_secret,
				appearance: { theme: "stripe" },
			}}
			stripe={stripePromise}
		>
			<CheckoutForm />
		</Elements>
	);
};
