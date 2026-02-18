import type { MetadataRoute } from "next";
import { SITE_URL } from "@/constants";
import { tabs, tabToHash } from "@/components/integration-tabs.constants";

export default function sitemap(): MetadataRoute.Sitemap {
	return [
		{
			url: SITE_URL,
			lastModified: new Date(),
			changeFrequency: "weekly",
			priority: 1,
		},
		...tabs.map((tab) => ({
			url: `${SITE_URL}/${tabToHash[tab]}`,
			lastModified: new Date(),
			changeFrequency: "weekly" as const,
			priority: 0.8,
		})),
	];
}
