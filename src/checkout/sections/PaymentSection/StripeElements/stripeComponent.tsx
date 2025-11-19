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

	// 1. Simplified Data Parsing
	const stripeData = useMemo(() => {
		const rawData = transactionInitializeResult.data?.transactionInitialize?.data as any;

		if (!rawData) return undefined;

		return {
			paymentIntent: rawData.paymentIntent,
			// Handle both naming conventions (Your App vs Official App)
			publishableKey: rawData.stripePublishableKey || rawData.publishableKey,
		};
	}, [transactionInitializeResult.data]);

	const { showCustomErrors } = useAlerts();
	const { errorMessages: commonErrorMessages } = useErrorMessages(apiErrorMessages);

	useEffect(() => {
		const gatewayId = config?.id || "saleor.app.payment.stripe";

		transactionInitialize({
			checkoutId: checkout.id,
			paymentGateway: {
				id: gatewayId,
				data: {
					// 2. FIX: Provide the mandatory 'paymentMethod' identifier
					paymentIntent: {
						paymentMethod: "card", // <--- ADDED THIS: Required by the App to identify the flow
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
