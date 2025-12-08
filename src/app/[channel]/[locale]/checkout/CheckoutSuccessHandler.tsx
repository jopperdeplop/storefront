"use client";

import { useEffect } from "react";

export function CheckoutSuccessHandler() {
	useEffect(() => {
		// Check if we have already cleaned up to avoid infinite reloads
		const hasCleaned = sessionStorage.getItem("order_cleaned");

		if (!hasCleaned) {
			console.log("Order confirmed: Performing nuclear cleanup...");

			// 1. DELETE ALL KNOWN SALEOR KEYS
			const keys = [
				"saleor_checkout_token",
				"checkoutToken",
				"saleor_cart",
				"_saleor_csrf_token",
				"checkout",
			];
			keys.forEach((key) => {
				localStorage.removeItem(key);
				// Also try removing from session storage just in case
				sessionStorage.removeItem(key);
			});

			// 2. EXPIRE COOKIES (Server-side tokens)
			const cookies = ["checkoutId", "token", "saleor_checkout_token", "saleor_channel"];
			cookies.forEach((name) => {
				document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
			});

			// 3. MARK AS CLEANED
			sessionStorage.setItem("order_cleaned", "true");

			// 4. THE NUCLEAR OPTION: HARD RELOAD
			// This forces the browser to re-download the page from scratch.
			// Since we deleted the tokens above, the new page load will have 0 items.
			window.location.reload();
		}
	}, []);

	return null;
}
