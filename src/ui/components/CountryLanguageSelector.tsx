"use client";

import { useParams, useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
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
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	const handleSelection = (channel: string, locale: string) => {
		document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
		const segments = pathname.split("/").filter(Boolean);
		const rest = segments.slice(2).join("/");
		setIsOpen(false);
		router.push(`/${channel}/${locale}/${rest ? "/" + rest : ""}`);
	};

	const filteredChannels = Object.entries(CHANNEL_CONFIG).filter(([, value]) =>
		value.name.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	return (
		<div className="relative inline-block text-left" ref={dropdownRef}>
			{/* Trigger Button: Premium & Compact */}
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex items-center gap-2 rounded-lg border border-stone-200 bg-white/95 px-3 py-1.5 text-xs font-semibold tracking-tight transition-all hover:border-stone-300 hover:bg-stone-50 active:scale-95 sm:text-sm",
					isOpen && "border-stone-400 bg-stone-50 ring-2 ring-stone-100",
				)}
			>
				<span className="text-base leading-none">{config.flag}</span>
				<span className="hidden leading-none text-stone-900 sm:inline">{config.name}</span>
				<span className="mx-0.5 text-stone-300">/</span>
				<span className="leading-none text-stone-600">{currentLocale.toUpperCase()}</span>
				<ChevronDown
					className={cn(
						"size-3.5 text-stone-400 transition-transform duration-300",
						isOpen && "rotate-180 text-stone-600",
					)}
				/>
			</button>

			{/* Dropdown Panel: Glassmorphism & Editorial Styling */}
			{isOpen && (
				<div
					className={cn(
						"animate-in fade-in zoom-in-95 bg-white/98 -right-20 top-full z-[100] mt-3 w-[300px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl duration-200 sm:right-0 sm:w-[340px]",
					)}
				>
					{/* Search Header */}
					<div className="border-b border-stone-100 bg-stone-50/50 p-4">
						<div className="group relative">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-terracotta" />
							<input
								type="text"
								placeholder="Search region..."
								autoFocus
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-xl border-stone-200 bg-white py-2 pl-9 pr-4 text-sm ring-stone-100 transition-all focus:border-terracotta focus:ring-4"
							/>
						</div>
					</div>

					{/* Channels List */}
					<div className="custom-scrollbar max-h-[380px] overflow-y-auto bg-white p-2">
						<div className="grid gap-1">
							{filteredChannels.map(([slug, channel]) => (
								<div key={slug} className="rounded-xl p-1 transition-colors hover:bg-stone-50">
									<div className="mb-1 flex items-center gap-2 px-2 py-1">
										<span className="text-xs">{channel.flag}</span>
										<span className="font-serif text-[11px] font-bold uppercase tracking-wider text-stone-500">
											{channel.name}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-1 px-1">
										{channel.locales.map((loc) => {
											const isSelected = currentChannel === slug && currentLocale === loc.code;
											return (
												<button
													key={`${slug}-${loc.code}`}
													onClick={() => handleSelection(slug, loc.code)}
													className={cn(
														"group flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-all",
														isSelected
															? "bg-stone-900 text-white shadow-lg shadow-stone-200"
															: "text-stone-700 hover:bg-stone-200/50 hover:text-stone-900",
													)}
												>
													<span className="font-medium">{loc.name}</span>
													{isSelected && (
														<Check className="animate-in fade-in zoom-in size-3.5 duration-300" />
													)}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>

						{filteredChannels.length === 0 && (
							<div className="flex flex-col items-center justify-center py-12 text-center">
								<div className="mb-2 rounded-full bg-stone-50 p-3">
									<Search className="size-6 text-stone-300" />
								</div>
								<p className="text-sm font-medium text-stone-400">
									No regions found for &quot;{searchQuery}&quot;
								</p>
							</div>
						)}
					</div>

					{/* Subtle Footer */}
					<div className="border-t border-stone-100 bg-stone-50/80 p-3.5">
						<div className="flex items-center justify-center gap-1.5 opacity-60">
							<span className="size-1 rounded-full bg-stone-300" />
							<p className="text-[10px] font-medium uppercase tracking-wider text-stone-500">
								Regional pricing & content active
							</p>
							<span className="size-1 rounded-full bg-stone-300" />
						</div>
					</div>
				</div>
			)}

			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 5px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: #e7e5e4; /* stone-200 */
					border-radius: 10px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: #d6d3d1; /* stone-300 */
				}
			`}</style>
		</div>
	);
};
