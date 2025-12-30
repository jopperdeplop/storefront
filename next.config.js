/** @type {import('next').NextConfig} */
const config = {
	images: {
		// We add the domain here for legacy support (often fixes Vercel 400 errors)
		domains: ["api.salp.shop"],

		// We add it here for modern Next.js support
		remotePatterns: [
			{
				protocol: "https",
				hostname: "api.salp.shop",
				port: "",
				pathname: "/**", // Allow any path after the domain
			},
			{
				// Keep the wildcard as a fallback
				protocol: "https",
				hostname: "*",
			},
		],
	},
	typedRoutes: false,
	// used in the Dockerfile
	output:
		process.env.NEXT_OUTPUT === "standalone"
			? "standalone"
			: process.env.NEXT_OUTPUT === "export"
				? "export"
				: undefined,
};

export default config;
