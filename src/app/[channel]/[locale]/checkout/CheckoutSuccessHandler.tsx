"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function CheckoutSuccessHandler() {
	const searchParams = useSearchParams();

	// CHECK 1: Do we have a finalized Order ID?
	const orderId = searchParams.get("order");

	// CHECK 2: Did Stripe just redirect us with a success flag?
	// The URL you pasted contains: &redirect_status=succeeded
	const stripeStatus = searchParams.get("redirect_status");
	const isStripeSuccess = stripeStatus === "succeeded";

	useEffect(() => {
		// TRIGGER: If either condition is true, nuking the cart is safe.
		if (orderId || isStripeSuccess) {
			console.log("Payment Succeeded (Detected via URL). clearing cart...");

			// 1. DELETE LOCAL STORAGE (Browser Memory)
			const keys = [
				"saleor_checkout_token",
				"checkoutToken",
				"saleor_cart",
				"_saleor_csrf_token",
				"checkout", // Sometimes simple "checkout" key is used
			];
			keys.forEach((key) => {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			});

			// 2. EXPIRE COOKIES (Server Memory)
			const cookies = ["checkoutId", "token", "saleor_checkout_token", "saleor_channel"];
			cookies.forEach((name) => {
				document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
			});

			// 3. NUCLEAR OPTION (Optional safety net)
			// If we found the Stripe Success flag specifically, we force a refresh
			// to ensure the UI updates if the user is stuck on the static page.
			if (isStripeSuccess && !sessionStorage.getItem("stripe_refresh_done")) {
				sessionStorage.setItem("stripe_refresh_done", "true");
				window.location.reload();
			}
		}
	}, [orderId, isStripeSuccess]);

	return null;
}
