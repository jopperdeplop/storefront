import TypographyPlugin from "@tailwindcss/typography";
import FormPlugin from "@tailwindcss/forms";
import ContainerQueriesPlugin from "@tailwindcss/container-queries";
import { type Config } from "tailwindcss";

const config: Config = {
	content: ["./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				// The "Digital Material" Palette
				carbon: "#0F0F0F", // Base background [cite: 164]
				vapor: "#F3F4F6", // Secondary background [cite: 164]
				cobalt: "#2F54EB", // Accent / Action [cite: 165]
				signal: "#10B981", // Stock indicators [cite: 166]
			},
		},
	},
	plugins: [TypographyPlugin, FormPlugin, ContainerQueriesPlugin],
};

export default config;
