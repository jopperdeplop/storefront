"use client";

import { usePathname } from "next/navigation";
import { LinkWithChannel } from "../atoms/LinkWithChannel";

export const Logo = () => {
	const pathname = usePathname();

	// The "Salp." visual identity
	const BrandMark = (
		<span className="select-none text-2xl font-bold uppercase tracking-tighter text-carbon md:text-3xl">
			Salp<span className="text-cobalt">.</span>
		</span>
	);

	if (pathname === "/") {
		return (
			<h1 className="flex items-center" aria-label="homepage">
				{BrandMark}
			</h1>
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
