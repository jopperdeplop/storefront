"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CheckoutSuccessHandler() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const orderConfirmed = searchParams.get("order");
	const redirectStatus = searchParams.get("redirect_status");

	useEffect(() => {
		// Only run if we are definitely in success mode
		if (orderConfirmed || redirectStatus === "succeeded") {
			console.log("NUCLEAR CLEANUP TRIGGERED");

			// 1. WIPE LOCAL STORAGE (Client Memory)
			const storageKeys = [
				"saleor_checkout_token",
				"checkoutToken",
				"saleor_cart",
				"_saleor_csrf_token",
				"checkout",
			];
			storageKeys.forEach((key) => {
				localStorage.removeItem(key);
				sessionStorage.removeItem(key);
			});

			// 2. WIPE COOKIES (Server Memory) - The "Shotgun" Approach
			// We must target multiple paths and domains to ensure we hit the right one.
			const cookieNames = ["checkoutId", "token", "saleor_checkout_token", "saleor_channel"];
			const domains = [
				window.location.hostname, // .www.salp.shop
				`.${window.location.hostname}`, // .salp.shop
				window.location.hostname.replace("www.", ""), // salp.shop
			];
			const paths = ["/", "/eur", "/eur/en"]; // Add your specific locale paths

			cookieNames.forEach((name) => {
				// Standard delete
				document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;

				// Loop through all domain/path combinations to find and kill the stubborn cookie
				domains.forEach((domain) => {
					paths.forEach((path) => {
						document.cookie = `${name}=; Path=${path}; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
					});
				});
			});

			// 3. FORCE REFRESH (The "Kick")
			// If we haven't refreshed yet, do it now to update the header icon.
			if (!sessionStorage.getItem("cart_refreshed")) {
				sessionStorage.setItem("cart_refreshed", "true");
				router.refresh();
			}
		}
	}, [orderConfirmed, redirectStatus, router]);

	return null;
}
