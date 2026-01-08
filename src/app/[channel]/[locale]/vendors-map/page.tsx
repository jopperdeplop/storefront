import { MapClient } from "@/ui/components/Map/MapClient";
import { type Metadata } from "next";

export const metadata: Metadata = {
	title: "Brand Hub | Salp Partner Map",
	description: "Explore our network of verified European partners on our interactive 3D map.",
};

export default function VendorsMapPage() {
	return (
		<main className="h-[calc(100vh-80px)] w-full">
			<MapClient />
		</main>
	);
}
