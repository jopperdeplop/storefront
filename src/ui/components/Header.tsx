import { Logo } from "./Logo";
import { Nav } from "./nav/Nav";

export function Header({ channel }: { channel: string }) {
	return (
		<header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur-md transition-all">
			<div className="mx-auto max-w-[1920px] px-4 md:px-8">
				<div className="flex h-16 items-center justify-between gap-4 md:h-20 md:gap-8">
					<Logo />
					<Nav channel={channel} />
				</div>
			</div>
		</header>
	);
}
