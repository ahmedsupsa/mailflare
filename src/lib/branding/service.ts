import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { appSettings } from "@/db/schema";
import type { Branding } from "./types";

export const APP_SETTINGS_ID = "default";
export const DEFAULT_APP_NAME = "Mailflare";
export const BRANDING_ICON_KEY = "branding/app-icon";

const EMPTY_BRANDING_EXTRAS = {
	emailFooter: "",
	websiteUrl: "",
	instagramUrl: "",
	tiktokUrl: "",
};

export async function getBranding(env: CloudflareEnv): Promise<Branding> {
	try {
		const [settings] = await getDb(env)
			.select()
			.from(appSettings)
			.where(eq(appSettings.id, APP_SETTINGS_ID))
			.limit(1);
		return {
			appName: settings?.appName || DEFAULT_APP_NAME,
			hasCustomIcon: !!settings?.iconKey,
			canCustomizeBranding: true,
			emailFooter: settings?.emailFooter ?? "",
			websiteUrl: settings?.websiteUrl ?? "",
			instagramUrl: settings?.instagramUrl ?? "",
			tiktokUrl: settings?.tiktokUrl ?? "",
		};
	} catch {
		return { appName: DEFAULT_APP_NAME, hasCustomIcon: false, canCustomizeBranding: true, ...EMPTY_BRANDING_EXTRAS };
	}
}

export async function updateBranding(
	env: CloudflareEnv,
	input: {
		appName: string;
		icon?: File | null;
		emailFooter?: string;
		websiteUrl?: string;
		instagramUrl?: string;
		tiktokUrl?: string;
	},
): Promise<Branding> {
	let iconKey: string | undefined;
	if (input.icon) {
		iconKey = BRANDING_ICON_KEY;
		await env.BUCKET.put(iconKey, await input.icon.arrayBuffer(), {
			httpMetadata: { contentType: input.icon.type },
		});
	}

	const extras = {
		emailFooter: input.emailFooter ?? null,
		websiteUrl: input.websiteUrl ?? null,
		instagramUrl: input.instagramUrl ?? null,
		tiktokUrl: input.tiktokUrl ?? null,
	};

	await getDb(env)
		.insert(appSettings)
		.values({
			id: APP_SETTINGS_ID,
			appName: input.appName,
			iconKey: iconKey ?? null,
			...extras,
		})
		.onConflictDoUpdate({
			target: appSettings.id,
			set: {
				appName: input.appName,
				...(iconKey ? { iconKey } : {}),
				...extras,
				updatedAt: new Date(),
			},
		});
	return getBranding(env);
}
