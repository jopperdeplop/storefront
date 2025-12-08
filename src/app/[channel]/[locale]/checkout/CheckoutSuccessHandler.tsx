"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function CheckoutSuccessHandler() {
	const searchParams = useSearchParams();
	const router = useRouter();

	const redirectStatus = searchParams.get("redirect_status");
	const checkoutParam = searchParams.get("checkout");
	const orderParam = searchParams.get("order");

	useEffect(() => {
		// If we are in success mode...
		if (redirectStatus === "succeeded" || orderParam) {
			console.log("Order Confirmed. Executing cleanup...");

			// 1. WIPE STORAGE
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

			// 2. EXPIRE COOKIES (Aggressive)
			// We set the domain to root to ensure we catch everything
			const cookies = ["checkoutId", "token", "saleor_checkout_token", "saleor_channel"];
			cookies.forEach((name) => {
				document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
				// Try removing with specific domain just in case
				document.cookie = `${name}=; Path=/; Domain=.${window.location.hostname}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
			});

			// 3. HANDLE REDIRECT vs REFRESH
			if (checkoutParam) {
				// If the URL still has the dirty 'checkout' ID, clean it up
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.delete("checkout");
				newUrl.searchParams.delete("payment_intent");
				newUrl.searchParams.delete("payment_intent_client_secret");
				if (!newUrl.searchParams.has("order")) {
					newUrl.searchParams.set("order", "confirmed");
				}
				window.location.href = newUrl.toString();
			} else {
				// If URL is already clean (where you are now), just refresh the UI
				// This updates the Cart Header Icon to 0
				router.refresh();
			}
		}
	}, [redirectStatus, checkoutParam, orderParam, router]);

	return null;
}
