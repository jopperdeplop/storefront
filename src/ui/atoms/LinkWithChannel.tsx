"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ComponentProps } from "react";

interface LinkWithChannelProps extends Omit<ComponentProps<typeof Link>, "href"> {
	href: string;
	channel?: string;
	locale?: string;
}

export const LinkWithChannel = ({
	href,
	channel: channelProp,
	locale: localeProp,
	...props
}: LinkWithChannelProps) => {
	const params = useParams();

	// 1. Priority: Override Prop > URL Param > Default Fallback
	// This ensures that if you are on /eur/nl, it persists 'nl'.
	const channel = channelProp || (typeof params?.channel === "string" ? params.channel : "netherlands");
	const locale = localeProp || (typeof params?.locale === "string" ? params.locale : "en");

	// 2. External Links: Don't modify them
	if (!href.startsWith("/")) {
		return <Link {...props} href={href} />;
	}

	// 3. Construct the Path
	// Example: /eur/nl/cart
	const hrefWithChannel = `/${channel}/${locale}${href}`;

	return <Link {...props} href={hrefWithChannel} />;
};
