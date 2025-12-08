"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function CheckoutSuccessHandler() {
	const searchParams = useSearchParams();
	const redirectStatus = searchParams.get("redirect_status");
	const checkoutParam = searchParams.get("checkout");
	const orderParam = searchParams.get("order");

	useEffect(() => {
		// TRIGGER: If we see "succeeded" status OR an Order ID
		if (redirectStatus === "succeeded" || orderParam) {
			console.log("Payment Succeeded. Cleaning up session...");

			// 1. WIPE STORAGE (Local & Session)
			const keys = [
				"saleor_checkout_token",
				"checkoutToken",
				"saleor_cart",
				"_saleor_csrf_token",
				"checkout",
			];
			keys.forEach((key) => {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			});

			// 2. EXPIRE COOKIES
			const cookies = ["checkoutId", "token", "saleor_checkout_token", "saleor_channel"];
			cookies.forEach((name) => {
				document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
			});

			// 3. THE FIX: REMOVE THE CHECKOUT ID FROM URL
			// If the URL still has '?checkout=...', RootWrapper will keep restoring the cart.
			// We must reload the page to a URL that DOES NOT have it.
			if (checkoutParam) {
				const newUrl = new URL(window.location.href);

				// Remove the parameters that cause the cart to reload
				newUrl.searchParams.delete("checkout");
				newUrl.searchParams.delete("payment_intent");
				newUrl.searchParams.delete("payment_intent_client_secret");

				// Add/Keep a flag so page.tsx knows to stay open
				if (!newUrl.searchParams.has("order")) {
					newUrl.searchParams.set("order", "confirmed");
				}

				// FORCE REDIRECT to the clean URL
				window.location.href = newUrl.toString();
			}
		}
	}, [redirectStatus, checkoutParam, orderParam]);

	return null;
}
