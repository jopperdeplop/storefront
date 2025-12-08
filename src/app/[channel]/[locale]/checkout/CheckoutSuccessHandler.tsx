"use client";

import { useEffect } from "react";

export function CheckoutSuccessHandler() {
	useEffect(() => {
		console.log("Order confirmed: Wiping cart data from storage...");

		// 1. Clear the standard Saleor Checkout Token
		// This makes the browser forget the current session
		localStorage.removeItem("saleor_checkout_token");

		// 2. Clear common variations just in case
		localStorage.removeItem("checkoutToken");
		localStorage.removeItem("checkout_token");
	}, []);

	// This component handles logic only, no visual UI
	return null;
}
