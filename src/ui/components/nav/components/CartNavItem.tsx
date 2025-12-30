import { ShoppingBagIcon } from "lucide-react";
import clsx from "clsx";
import * as Checkout from "@/lib/checkout";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { CheckoutFindDocument, type LanguageCodeEnum } from "@/gql/graphql";
import { executeGraphQL } from "@/lib/graphql";

export const CartNavItem = async ({ channel, locale }: { channel: string; locale: string }) => {
	const checkoutId = await Checkout.getIdFromCookies(channel);
	let lineCount = 0;

	// FIX: Guard against undefined locale to prevent crash
	const localeEnum = (locale ? locale.toUpperCase() : "EN") as LanguageCodeEnum;

	if (checkoutId) {
		try {
			const { checkout } = await executeGraphQL(CheckoutFindDocument, {
				variables: {
					id: checkoutId,
					locale: localeEnum,
				},
				cache: "no-cache",
			});
			lineCount = checkout?.lines.reduce((result, line) => result + line.quantity, 0) || 0;
		} catch (error) {
			console.error("Failed to fetch checkout for CartNavItem:", error);
			// Ignore error and show 0 items to prevent nav crash
		}
	}

	return (
		<LinkWithChannel href="/cart" className="relative flex items-center" data-testid="CartNavItem">
			<ShoppingBagIcon className="size-6 shrink-0" aria-hidden="true" />
			{lineCount > 0 ? (
				<div
					className={clsx(
						"absolute bottom-0 right-0 -mb-2 -mr-2 flex h-4 flex-col items-center justify-center rounded bg-neutral-900 text-xs font-medium text-white",
						lineCount > 9 ? "w-[3ch]" : "w-[2ch]",
					)}
				>
					{lineCount} <span className="sr-only">item{lineCount > 1 ? "s" : ""} in cart, view bag</span>
				</div>
			) : (
				<span className="sr-only">0 items in cart</span>
			)}
		</LinkWithChannel>
	);
};
