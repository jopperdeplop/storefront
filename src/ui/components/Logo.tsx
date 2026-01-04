"use client";

import { usePathname } from "next/navigation";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

export const Logo = () => {
	const pathname = usePathname();

	// The "Euro-Standard" visual identity (Editorial/Magazine style)
	const BrandMark = (
		<span className="select-none font-serif text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
			Salp<span className="text-terracotta">.</span>
		</span>
	);

	if (pathname === "/") {
		return (
			<span className="flex items-center" aria-label="homepage">
				{BrandMark}
			</span>
		);
	}
	return (
		<div className="flex items-center">
			<LinkWithChannel aria-label="homepage" href="/">
				{BrandMark}
			</LinkWithChannel>
		</div>
	);
};
