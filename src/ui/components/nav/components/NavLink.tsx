"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

interface NavLinkProps {
	href: string;
	children: ReactNode;
}

export const NavLink = ({ href, children }: NavLinkProps) => {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<LinkWithChannel
			href={href}
			className={`text-sm font-medium uppercase tracking-wider transition-colors hover:text-terracotta ${
				isActive ? "border-b-2 border-terracotta text-terracotta" : "text-gray-900"
			}`}
		>
			{children}
		</LinkWithChannel>
	);
};
