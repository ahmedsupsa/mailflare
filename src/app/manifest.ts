import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import { APP_SETTINGS_ID } from "@/lib/branding/service";
import { getEnvAsync } from "@/lib/cloudflare";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getAppName(): Promise<string> {
	try {
		const env = await getEnvAsync();
		const [settings] = await getDb(env)
			.select({ appName: appSettings.appName })
			.from(appSettings)
			.where(eq(appSettings.id, APP_SETTINGS_ID))
			.limit(1);
		return settings?.appName?.trim() || "Mail";
	} catch {
		return "Mail";
	}
}

export default async function manifest(): Promise<MetadataRoute.Manifest> {
	const name = await getAppName();
	return {
		name,
		short_name: name,
		description: "بريد إلكتروني داخلي لفريقك",
		start_url: "/inbox",
		scope: "/",
		display: "standalone",
		lang: "ar",
		dir: "rtl",
		background_color: "#f5f5f5",
		theme_color: "#171717",
		icons: [
			{ src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
			{ src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
			{ src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
		],
	};
}
