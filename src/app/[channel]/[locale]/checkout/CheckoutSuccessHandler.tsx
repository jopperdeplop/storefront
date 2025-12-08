"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { clearSaleorSession } from "./actions";

export function CheckoutSuccessHandler() {
	const searchParams = useSearchParams();
	const orderConfirmed = searchParams.get("order");
	const redirectStatus = searchParams.get("redirect_status");

	useEffect(() => {
		// RUN ONLY ON SUCCESS
		if (orderConfirmed || redirectStatus === "succeeded") {
			console.log("Payment Successful. Invoking Server-Side Cleanup...");

			// 1. WIPE CLIENT STORAGE
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

			// 2. CALL SERVER ACTION
			// FIX: Added 'void' before the function call to satisfy the linter
			void clearSaleorSession().then(() => {
				console.log("Server cookies destroyed.");

				// 3. FORCE REFRESH TO UPDATE UI
				if (!sessionStorage.getItem("cleanup_done")) {
					sessionStorage.setItem("cleanup_done", "true");
					window.location.reload();
				}
			});
		}
	}, [orderConfirmed, redirectStatus]);

	return null;
}
