import TypographyPlugin from "@tailwindcss/typography";
import FormPlugin from "@tailwindcss/forms";
import ContainerQueriesPlugin from "@tailwindcss/container-queries";
import { type Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				// "Euro-Standard" Palette (v7.0)
				terracotta: {
					DEFAULT: "#cc5500", // Burnt Terracotta
					dark: "#b34400", // Hover state
				},
				stone: {
					50: "#fafaf9", // Editorial background
					100: "#f5f5f4",
				},
				// Legacy "Digital Material" Palette (Preserved for compatibility)
				carbon: "#0F0F0F",
				vapor: "#F3F4F6",
				cobalt: "#2F54EB",
				signal: "#10B981",
			},
			fontFamily: {
				// Editorial Typography Specification
				serif: ["Times New Roman", "Times", "serif"], // For Headings [cite: 101]
				sans: ["Inter", "system-ui", "sans-serif"], // For Body/Price [cite: 102]
				mono: ["Courier New", "Courier", "monospace"], // For Tech/Specs
			},
		},
	},
	plugins: [TypographyPlugin, FormPlugin, ContainerQueriesPlugin],
};

export default config;
