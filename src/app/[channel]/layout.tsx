import { type ReactNode } from "react";
import { executeGraphQL } from "@/lib/graphql";
import { ChannelsListDocument } from "@/gql/graphql";

export const generateStaticParams = async () => {
	// Guard: If no token, return default
	if (!process.env.SALEOR_APP_TOKEN) {
		return [{ channel: "default-channel" }];
	}

	try {
		const channels = await executeGraphQL(ChannelsListDocument, {
			withAuth: false,
			headers: {
				Authorization: `Bearer ${process.env.SALEOR_APP_TOKEN}`,
			},
		});

		return (
			channels.channels
				?.filter((channel) => channel.isActive)
				.map((channel) => ({ channel: channel.slug })) ?? []
		);
	} catch (error) {
		console.error("Failed to fetch channels in layout. Defaulting to 'eur'.", error);
		// Fallback to prevent 500 crash during dev
		return [{ channel: "eur" }];
	}
};

export default function ChannelLayout({ children }: { children: ReactNode }) {
	return children;
}
