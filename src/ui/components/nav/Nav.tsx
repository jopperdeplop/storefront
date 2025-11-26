import { Suspense } from "react";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { NavLinks } from "./components/NavLinks";
// IMPORT THE NEW MOBILE COMPONENT
import { MobileNavLinks } from "./components/MobileNavLinks";
import { MobileMenu } from "./components/MobileMenu";
import { SearchBar } from "./components/SearchBar";

export const Nav = ({ channel }: { channel: string }) => {
	return (
		<nav className="flex w-full items-center gap-4 lg:gap-6" aria-label="Main navigation">
			{/* Desktop Navigation Links (Standard links, no plus icons) */}
			<ul className="hidden gap-6 overflow-x-auto whitespace-nowrap md:flex lg:gap-8 lg:px-0">
				<NavLinks channel={channel} />
			</ul>

			{/* Right Side Actions (Search, User, Cart) */}
			<div className="ml-auto flex items-center gap-4 lg:gap-8">
				{/* Search Bar (Desktop) */}
				<div className="hidden min-w-[300px] lg:flex">
					{/* FIXED: Removed channel prop */}
					<SearchBar />
				</div>

				{/* User Account */}
				<Suspense fallback={<div className="h-8 w-8" />}>
					<UserMenuContainer />
				</Suspense>

				{/* Cart Icon */}
				<div className="flex items-center">
					<Suspense fallback={<div className="h-6 w-6" />}>
						<CartNavItem channel={channel} />
					</Suspense>
				</div>
			</div>

			{/* Mobile Menu Trigger */}
			<Suspense>
				<MobileMenu>
					{/* FIXED: Removed channel prop */}
					<SearchBar />
					{/* UPDATED: Use MobileNavLinks here to get the dropdowns/plus icons */}
					<MobileNavLinks channel={channel} />
				</MobileMenu>
			</Suspense>
		</nav>
	);
};
