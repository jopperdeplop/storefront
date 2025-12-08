"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function CheckoutSuccessHandler() {
	const router = useRouter();

	useEffect(() => {
		console.log("Order confirmed: Executing cleanup...");

		// 1. CLEAR LOCAL STORAGE (The browser memory)
		const keysToRemove = ["saleor_checkout_token", "checkoutToken", "saleor_cart", "_saleor_csrf_token"];
		keysToRemove.forEach((key) => localStorage.removeItem(key));

		// 2. CLEAR COOKIES (The server memory)
		// We force-expire the cookies by setting their date to the past.
		// Common names for Saleor cookies: 'checkoutId', 'token', 'saleor_channel'
		const cookiesToDelete = ["checkoutId", "token", "saleor_checkout_token"];

		cookiesToDelete.forEach((name) => {
			document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
		});

		// 3. FORCE UI REFRESH (Crucial for App Router)
		// This tells Next.js: "Re-fetch the data for the Navbar/Cart icon now"
		router.refresh();
	}, [router]);

	return null;
}
