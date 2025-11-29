"use client";

import clsx from "clsx";

interface CheckoutLinkProps {
	checkoutId: string | null;
	disabled: boolean;
	className: string;
	// NEW PROPS: Added in the previous step
	channel: string;
	locale: string;
}

export function CheckoutLink({ checkoutId, disabled, className, channel, locale }: CheckoutLinkProps) {
	// FIX 1: Construct the full localized path including channel and locale
	const href = `/${channel}/${locale}/checkout?checkout=${checkoutId}`;

	if (!checkoutId || disabled) {
		return (
			<button disabled className={clsx(className, "cursor-not-allowed")}>
				Checkout
			</button>
		);
	}

	return (
		// FIX 2: Use the standard <a> tag required by your project structure (based on the original code)
		<a
			data-testid="CheckoutLink"
			aria-disabled={disabled}
			onClick={(e) => disabled && e.preventDefault()}
			href={href}
			className={clsx(
				// Use the className prop passed down from the parent
				className,
				"inline-block max-w-full rounded border border-transparent bg-neutral-900 px-6 py-3 text-center font-medium text-neutral-50 hover:bg-neutral-800 aria-disabled:cursor-not-allowed aria-disabled:bg-neutral-500 sm:px-16",
			)}
		>
			Checkout
		</a>
	);
}
