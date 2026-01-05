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
	{ name: string; flag: string; code: string; locales: { code: string; name: string }[] }
> = {
	austria: {
		name: "Austria",
		flag: "🇦🇹",
		code: "at",
		locales: [
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	belgium: {
		name: "Belgium",
		flag: "🇧🇪",
		code: "be",
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
		code: "hr",
		locales: [
			{ code: "hr", name: "Hrvatski" },
			{ code: "en", name: "English" },
		],
	},
	cyprus: {
		name: "Cyprus",
		flag: "🇨🇾",
		code: "cy",
		locales: [
			{ code: "el", name: "Ελληνικά" },
			{ code: "en", name: "English" },
		],
	},
	estonia: {
		name: "Estonia",
		flag: "🇪🇪",
		code: "ee",
		locales: [
			{ code: "et", name: "Eesti" },
			{ code: "en", name: "English" },
		],
	},
	finland: {
		name: "Finland",
		flag: "🇫🇮",
		code: "fi",
		locales: [
			{ code: "fi", name: "Suomi" },
			{ code: "en", name: "English" },
		],
	},
	france: {
		name: "France",
		flag: "🇫🇷",
		code: "fr",
		locales: [
			{ code: "fr", name: "Français" },
			{ code: "en", name: "English" },
		],
	},
	germany: {
		name: "Germany",
		flag: "🇩🇪",
		code: "de",
		locales: [
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	greece: {
		name: "Greece",
		flag: "🇬🇷",
		code: "gr",
		locales: [
			{ code: "el", name: "Ελληνικά" },
			{ code: "en", name: "English" },
		],
	},
	ireland: { name: "Ireland", flag: "🇮🇪", code: "ie", locales: [{ code: "en", name: "English" }] },
	italy: {
		name: "Italy",
		flag: "🇮🇹",
		code: "it",
		locales: [
			{ code: "it", name: "Italiano" },
			{ code: "en", name: "English" },
		],
	},
	latvia: {
		name: "Latvia",
		flag: "🇱🇻",
		code: "lv",
		locales: [
			{ code: "lv", name: "Latviešu" },
			{ code: "en", name: "English" },
		],
	},
	lithuania: {
		name: "Lithuania",
		flag: "🇱🇹",
		code: "lt",
		locales: [
			{ code: "lt", name: "Lietuvių" },
			{ code: "en", name: "English" },
		],
	},
	luxembourg: {
		name: "Luxembourg",
		flag: "🇱🇺",
		code: "lu",
		locales: [
			{ code: "fr", name: "Français" },
			{ code: "de", name: "Deutsch" },
			{ code: "en", name: "English" },
		],
	},
	malta: {
		name: "Malta",
		flag: "🇲🇹",
		code: "mt",
		locales: [
			{ code: "mt", name: "Malti" },
			{ code: "en", name: "English" },
		],
	},
	netherlands: {
		name: "Netherlands",
		flag: "🇳🇱",
		code: "nl",
		locales: [
			{ code: "nl", name: "Nederlands" },
			{ code: "en", name: "English" },
		],
	},
	portugal: {
		name: "Portugal",
		flag: "🇵🇹",
		code: "pt",
		locales: [
			{ code: "pt", name: "Português" },
			{ code: "en", name: "English" },
		],
	},
	slovakia: {
		name: "Slovakia",
		flag: "🇸🇰",
		code: "sk",
		locales: [
			{ code: "sk", name: "Slovenčina" },
			{ code: "en", name: "English" },
		],
	},
	slovenia: {
		name: "Slovenia",
		flag: "🇸🇮",
		code: "si",
		locales: [
			{ code: "sl", name: "Slovenščina" },
			{ code: "en", name: "English" },
		],
	},
	spain: {
		name: "Spain",
		flag: "🇪🇸",
		code: "es",
		locales: [
			{ code: "es", name: "Español" },
			{ code: "en", name: "English" },
		],
	},
};

export const CountryLanguageSelector = ({ isMobile = false }: { isMobile?: boolean }) => {
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
		if (isOpen && !isMobile) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen, isMobile]);

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

	// --- MOBILE INLINE VERSION ---
	if (isMobile) {
		return (
			<div className="flex flex-col gap-4 py-2">
				<button
					onClick={() => setIsOpen(!isOpen)}
					className="flex w-full items-center justify-between rounded-xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-900"
				>
					<div className="flex items-center gap-3">
						<img
							src={`https://flagcdn.com/w40/${config.code}.png`}
							alt={config.name}
							className="h-4 w-auto rounded-sm object-cover shadow-sm"
						/>
						<span>
							{config.name} ({currentLocale.toUpperCase()})
						</span>
					</div>
					<ChevronDown className={cn("size-4 transition-transform duration-300", isOpen && "rotate-180")} />
				</button>

				{isOpen && (
					<div className="animate-in slide-in-from-top-2 fade-in flex flex-col gap-4 duration-300">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
							<input
								type="text"
								placeholder="Search regions..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-xl border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-stone-400 focus:ring-0"
							/>
						</div>

						<div className="flex flex-col gap-6">
							{filteredChannels.map(([slug, channel]) => (
								<div key={slug} className="flex flex-col gap-2">
									<div className="flex items-center gap-2 px-1">
										<img
											src={`https://flagcdn.com/w40/${channel.code}.png`}
											alt={channel.name}
											className="h-3 w-auto rounded-sm object-cover"
										/>
										<span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
											{channel.name}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-2">
										{channel.locales.map((loc) => {
											const isSelected = currentChannel === slug && currentLocale === loc.code;
											return (
												<button
													key={`${slug}-${loc.code}`}
													onClick={() => handleSelection(slug, loc.code)}
													className={cn(
														"flex items-center justify-between rounded-lg border px-3 py-2.5 text-xs transition-all",
														isSelected
															? "border-stone-900 bg-stone-900 text-white"
															: "border-stone-200 bg-white text-stone-600 active:bg-stone-50",
													)}
												>
													<span className="font-semibold">{loc.name}</span>
													{isSelected && <Check className="size-3.5" />}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="relative flex items-center" ref={dropdownRef}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex h-10 items-center gap-2.5 rounded-full border border-stone-200 px-4 text-[13px] font-bold tracking-tight transition-all active:scale-95",
					isOpen
						? "border-stone-900 bg-stone-900 text-white shadow-lg"
						: "bg-white text-stone-900 hover:border-stone-400 hover:bg-stone-50",
				)}
			>
				<div className="flex items-center gap-1.5 overflow-hidden rounded-[2px] shadow-sm ring-1 ring-stone-900/5">
					<img
						src={`https://flagcdn.com/w40/${config.code}.png`}
						alt={config.name}
						className="h-3.5 w-auto object-cover"
					/>
				</div>
				<span className={cn("leading-none", isOpen ? "text-white" : "text-stone-900")}>
					{currentLocale.toUpperCase()}
				</span>
				<ChevronDown
					className={cn(
						"size-3 transition-transform duration-300",
						isOpen ? "rotate-180 text-white/70" : "text-stone-400",
					)}
				/>
			</button>

			{isOpen && (
				<div
					className={cn(
						"animate-in fade-in zoom-in-95 absolute right-0 top-full z-[1000] mt-3 w-[360px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_25px_70px_-15px_rgba(0,0,0,0.3)] duration-200",
					)}
				>
					<div className="border-b border-stone-100 bg-stone-50/50 p-3">
						<div className="group relative">
							<Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-stone-400" />
							<input
								type="text"
								placeholder="Search region..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="w-full rounded-lg border-stone-200 bg-white py-1.5 pl-9 pr-4 text-xs ring-stone-100 transition-all focus:border-stone-400 focus:ring-4"
							/>
						</div>
					</div>

					<div className="custom-scrollbar max-h-[400px] overflow-y-auto bg-white p-2">
						<div className="grid gap-2">
							{filteredChannels.map(([slug, channel]) => (
								<div key={slug} className="rounded-xl p-1.5 transition-colors hover:bg-stone-50/50">
									<div className="mb-1.5 flex items-center gap-2 px-2 py-0.5">
										<img
											src={`https://flagcdn.com/w40/${channel.code}.png`}
											alt={channel.name}
											className="h-2.5 w-auto rounded-[1px] object-cover shadow-sm"
										/>
										<span className="font-serif text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
											{channel.name}
										</span>
									</div>
									<div className="grid grid-cols-2 gap-1.5 px-0.5">
										{channel.locales.map((loc) => {
											const isSelected = currentChannel === slug && currentLocale === loc.code;
											return (
												<button
													key={`${slug}-${loc.code}`}
													onClick={() => handleSelection(slug, loc.code)}
													className={cn(
														"group flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-all",
														isSelected
															? "bg-stone-900 text-white shadow-lg shadow-stone-200"
															: "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900",
													)}
												>
													<span className="font-semibold">{loc.name}</span>
													{isSelected && <Check className="animate-in fade-in zoom-in size-3 duration-300" />}
												</button>
											);
										})}
									</div>
								</div>
							))}
						</div>

						{filteredChannels.length === 0 && (
							<div className="flex flex-col items-center justify-center py-10 text-center">
								<p className="text-[11px] font-medium text-stone-400">
									No regions for &quot;{searchQuery}&quot;
								</p>
							</div>
						)}
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
					background: #e7e5e4;
					border-radius: 10px;
				}
			`}</style>
		</div>
	);
};
