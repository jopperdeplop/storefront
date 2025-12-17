import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";
import { StickyHeader } from "./StickyHeader";

// Updated to accept locale (drilled from layout.tsx)
export function Header({ channel, locale }: { channel: string; locale: string }) {
	return (
		<StickyHeader>
			<div className="mx-auto max-w-[1920px] px-4 md:px-8">
				<div className="flex h-16 items-center justify-between gap-4 md:h-20 md:gap-8">
					<Logo />
					<Nav channel={channel} locale={locale} />
				</div>
			</div>
		</StickyHeader>
	);
}
