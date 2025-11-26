// This file maps your Saleor Channel Slugs to your Algolia Indices
export const CHANNEL_TO_INDEX: Record<string, string> = {
	// 'channel-slug': 'algolia-index-name'
	"default-channel": "default-channel.USD.products",
	"channel-pln": "channel-pln.PLN.products",
	eur: "eur.EUR.products",
};

export const getAlgoliaIndexName = (channelSlug: string) => {
	// If we can't find a match for the channel, fallback to the default (USD)
	return CHANNEL_TO_INDEX[channelSlug] || CHANNEL_TO_INDEX["default-channel"];
};
