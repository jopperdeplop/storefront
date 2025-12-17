"use client";

import { useState, useEffect, type ReactNode } from "react";

export function StickyHeader({ children }: { children: ReactNode }) {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			setScrolled(window.scrollY > 10);
		};

		window.addEventListener("scroll", handleScroll);
		// Check initial value
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<header
			className={`sticky top-0 z-50 border-b transition-all duration-500 ease-out ${
				scrolled ? "border-white/20 bg-white/70 shadow-sm backdrop-blur-xl" : "border-stone-200 bg-white"
			}`}
		>
			{children}
		</header>
	);
}
