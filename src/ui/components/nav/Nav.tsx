import { Suspense } from "react";
import dynamic from "next/dynamic";
import { UserMenuContainer } from "./components/UserMenu/UserMenuContainer";
import { CartNavItem } from "./components/CartNavItem";
import { CategoryDropdown } from "./components/CategoryDropdown";
// IMPORT THE NEW MOBILE COMPONENT
import { MobileNavLinks } from "./components/MobileNavLinks";
const MobileMenu = dynamic(() => import("./components/MobileMenu").then((m) => m.MobileMenu));
import { SearchBar } from "./components/SearchBar";

// Updated to accept locale to keep previous translation fixes working
export const Nav = ({ channel, locale }: { channel: string; locale: string }) => {
	return (
		<nav className="flex w-full items-center gap-4 lg:gap-8" aria-label="Main navigation">
			{/* 1. Category Dropdown (Desktop) */}
			<div className="hidden shrink-0 lg:block">
				<CategoryDropdown channel={channel} locale={locale} />
			</div>

			{/* 2. Central Search Bar (Expanded) */}
			<div className="hidden flex-1 lg:block">
				<SearchBar />
			</div>

			{/* 3. Right Side Actions (User, Cart) */}
			<div className="ml-auto flex items-center gap-4 lg:gap-6">
				{/* User Account */}
				<Suspense fallback={<div className="size-8" />}>
					<UserMenuContainer />
				</Suspense>

				{/* Cart Icon */}
				<div className="flex items-center">
					<Suspense fallback={<div className="size-6" />}>
						<CartNavItem channel={channel} locale={locale} />
					</Suspense>
				</div>
			</div>

			{/* Mobile Menu Trigger */}
			<Suspense>
				<MobileMenu>
					{/* FIXED: Removed channel prop */}
					<SearchBar />
					{/* UPDATED: Use MobileNavLinks here to get the dropdowns/plus icons */}
					<MobileNavLinks channel={channel} locale={locale} />
				</MobileMenu>
			</Suspense>
		</nav>
	);
};
