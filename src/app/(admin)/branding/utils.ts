import { authFetch } from "@/lib/auth/client";
import type { BrandingFormResponse } from "./types";

export const BRANDING_ICON_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";

export async function saveBranding(input: {
	appName: string;
	icon: File | null;
	emailFooter: string;
	websiteUrl: string;
	instagramUrl: string;
	tiktokUrl: string;
}): Promise<BrandingFormResponse> {
	const form = new FormData();
	form.set("appName", input.appName);
	form.set("emailFooter", input.emailFooter);
	form.set("websiteUrl", input.websiteUrl);
	form.set("instagramUrl", input.instagramUrl);
	form.set("tiktokUrl", input.tiktokUrl);
	if (input.icon) form.set("icon", input.icon, input.icon.name);
	const response = await authFetch("/api/branding", { method: "PUT", body: form });
	const data = (await response.json()) as BrandingFormResponse;
	if (!response.ok) throw new Error(data.error ?? "تعذر حفظ الهوية");
	return data;
}
