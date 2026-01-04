"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown, Search } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const CHANNEL_CONFIG: Record<
	string,
	{ name: string; flag: string; locales: { code: string; name: string }[] }
> = {
	austria: {
		name: "Austria",
		flag: "🇦🇹",
		locales: [
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	belgium: {
		name: "Belgium",
		flag: "🇧🇪",
		locales: [
			{ code: "nl", name: "Nederlands" },
			{ code: "fr", name: "Français" },
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	croatia: {
		name: "Croatia",
		flag: "🇭🇷",
		locales: [
			{ code: "hr", name: "Hrvatski" },
			{ code: "en", name: "English" },
		],
	},
	cyprus: {
		name: "Cyprus",
		flag: "🇨🇾",
		locales: [
			{ code: "el", name: "Ελληνικά" },
			{ code: "en", name: "English" },
		],
	},
	estonia: {
		name: "Estonia",
		flag: "🇪🇪",
		locales: [
			{ code: "et", name: "Eesti" },
			{ code: "en", name: "English" },
		],
	},
	finland: {
		name: "Finland",
		flag: "🇫🇮",
		locales: [
			{ code: "fi", name: "Suomi" },
			{ code: "en", name: "English" },
		],
	},
	france: {
		name: "France",
		flag: "🇫🇷",
		locales: [
			{ code: "fr", name: "Français" },
			{ code: "en", name: "English" },
		],
	},
	germany: {
		name: "Germany",
		flag: "🇩🇪",
		locales: [
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	greece: {
		name: "Greece",
		flag: "🇬🇷",
		locales: [
			{ code: "el", name: "Ελληνικά" },
			{ code: "en", name: "English" },
		],
	},
	ireland: { name: "Ireland", flag: "🇮🇪", locales: [{ code: "en", name: "English" }] },
	italy: {
		name: "Italy",
		flag: "🇮🇹",
		locales: [
			{ code: "it", name: "Italiano" },
			{ code: "en", name: "English" },
		],
	},
	latvia: {
		name: "Latvia",
		flag: "🇱🇻",
		locales: [
			{ code: "lv", name: "Latviešu" },
			{ code: "en", name: "English" },
		],
	},
	lithuania: {
		name: "Lithuania",
		flag: "🇱🇹",
		locales: [
			{ code: "lt", name: "Lietuvių" },
			{ code: "en", name: "English" },
		],
	},
	luxembourg: {
		name: "Luxembourg",
		flag: "🇱🇺",
		locales: [
			{ code: "fr", name: "Français" },
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	malta: {
		name: "Malta",
		flag: "🇲🇹",
		locales: [
			{ code: "mt", name: "Malti" },
			{ code: "en", name: "English" },
		],
	},
	netherlands: {
		name: "Netherlands",
		flag: "🇳🇱",
		locales: [
			{ code: "nl", name: "Nederlands" },
			{ code: "en", name: "English" },
		],
	},
	portugal: {
		name: "Portugal",
		flag: "🇵🇹",
		locales: [
			{ code: "pt", name: "Português" },
			{ code: "en", name: "English" },
		],
	},
	slovakia: {
		name: "Slovakia",
		flag: "🇸🇰",
		locales: [
			{ code: "sk", name: "Slovenčina" },
			{ code: "en", name: "English" },
		],
	},
	slovenia: {
		name: "Slovenia",
		flag: "🇸🇮",
		locales: [
			{ code: "sl", name: "Slovenščina" },
			{ code: "en", name: "English" },
		],
	},
	spain: {
		name: "Spain",
		flag: "🇪🇸",
		locales: [
			{ code: "es", name: "Español" },
			{ code: "en", name: "English" },
		],
	},
};

export const CountryLanguageSelector = () => {
	const router = useRouter();
	const pathname = usePathname();
	const params = useParams<{ channel: string; locale: string }>();

	const [isOpen, setIsOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const dropdownRef = useRef<HTMLDivElement>(null);

	const currentChannel = params.channel || "netherlands";
	const currentLocale = params.locale || "en";
	const config = CHANNEL_CONFIG[currentChannel] || CHANNEL_CONFIG.netherlands;

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelection = (channel: string, locale: string) => {
		// Set cookie for persistence (30 days)
		document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

		// Construct new path
		const segments = pathname.split("/").filter(Boolean);
		const rest = segments.slice(2).join("/");

		setIsOpen(false);
		router.push(`/${channel}/${locale}/${rest}`);
	};

	const filteredChannels = Object.entries(CHANNEL_CONFIG).filter(([key, value]) =>
		value.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="relative" ref={dropdownRef}>
			{/* Trigger Button */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-sm font-medium transition-all hover:bg-neutral-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900/80 dark:hover:bg-neutral-800"
			>
				<span className="text-base">{config.flag}</span>
				<span className="hidden md:inline">{config.name}</span>
				<span className="text-neutral-400">/</span>
				<span>{currentLocale.toUpperCase()}</span>
				<ChevronDown className={cn("size-4 text-neutral-400 transition-transform", isOpen && "rotate-180")} />
			</button>

			{/* Dropdown Panel */}
			{isOpen && (
				<div className="animate-in fade-in zoom-in-95 absolute right-0 top-full z-[100] mt-2 w-[320px] origin-top-right overflow-hidden rounded-2xl border border-neutral-200 bg-white/90 shadow-2xl backdrop-blur-xl duration-200 dark:border-neutral-800 dark:bg-neutral-900/90">
					<div className="p-4">
						<div className="relative mb-4">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
							<input
								type="text"
								placeholder="Search country..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-xl border-none bg-neutral-100 py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-black/5 dark:bg-neutral-800"
							/>
						</div>

						<div className="custom-scrollbar max-h-[300px] overflow-y-auto pr-1">
							{filteredChannels.map(([slug, channel]) => (
								<div key={slug} className="mb-4 last:mb-0">
									<div className="mb-1 flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
										<span>{channel.flag}</span>
										<span>{channel.name}</span>
									</div>
									<div className="grid grid-cols-2 gap-1 px-1">
										{channel.locales.map((loc) => {
											const isSelected = currentChannel === slug && currentLocale === loc.code;
											return (
												<button
													key={`${slug}-${loc.code}`}
													onClick={() => handleSelection(slug, loc.code)}
													className={cn(
														"flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800",
														isSelected &&
															"bg-black text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-white",
													)}
												>
													<span>{loc.name}</span>
													{isSelected && <Check className="size-3" />}
												</button>
											);
										})}
									</div>
								</div>
							))}
							{filteredChannels.length === 0 && (
								<div className="py-8 text-center text-sm text-neutral-400">
									No countries found for &quot;{searchQuery}&quot;
								</div>
							)}
						</div>
					</div>

					{/* Footer / Helper */}
					<div className="border-t border-neutral-100 bg-neutral-50/50 p-3 text-center text-[10px] text-neutral-500 dark:border-neutral-800 dark:bg-neutral-800/50">
						Prices and availability are shown based on your region.
					</div>
				</div>
			)}

			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #e5e5e5;
					border-radius: 10px;
				}
				.dark .custom-scrollbar::-webkit-scrollbar-thumb {
					background: #404040;
				}
			`}</style>
		</div>
	);
};
