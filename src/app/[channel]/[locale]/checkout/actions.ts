"use server";

import { cookies } from "next/headers";

export async function clearSaleorSession() {
	console.log("SERVER ACTION: Destroying Saleor Session Cookies");

	const cookieStore = await cookies();

	// List of all possible Saleor cookie names
	const keys = ["checkoutId", "token", "saleor_checkout_token", "saleor_channel", "saleor_cart"];

	// Force delete them on the server side
	keys.forEach((key) => {
		cookieStore.delete(key);
	});

	return { success: true };
}
