"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ComponentProps } from "react";

export const LinkWithChannel = ({
	href,
	...props
}: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) => {
	const params = useParams();

	// 1. Safety Checks: Ensure channel and locale exist, or fallback to defaults
	const channel = typeof params?.channel === "string" ? params.channel : "default-channel";
	const locale = typeof params?.locale === "string" ? params.locale : "en";

	// 2. External Links: Don't modify them
	if (!href.startsWith("/")) {
		return <Link {...props} href={href} />;
	}

	// 3. Construct the Path
	// We want: /[channel]/[locale]/[href]
	// Example: /eur/nl/cart
	const hrefWithChannel = `/${channel}/${locale}${href}`;

	return <Link {...props} href={hrefWithChannel} />;
};
