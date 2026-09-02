import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/auth/admin";
import { requireUser } from "@/lib/auth/cookies";
import { getBranding, updateBranding } from "@/lib/branding/service";
import { getEnv } from "@/lib/cloudflare";
import { BRANDING_ICON_TYPES, isBrandingIcon, MAX_BRANDING_ICON_SIZE } from "./utils";

export async function GET() {
	return NextResponse.json(await getBranding(getEnv()), {
		headers: { "Cache-Control": "no-store" },
	});
}

export async function PUT(request: Request) {
	const env = getEnv();
	try {
		assertAdmin(await requireUser(env, request));
	} catch {
		return NextResponse.json({ error: "غير مصرح لك بالوصول" }, { status: 403 });
	}

	const form = await request.formData();
	const appName = String(form.get("appName") ?? "").trim();
	const emailFooter = String(form.get("emailFooter") ?? "").trim();
	const websiteUrl = String(form.get("websiteUrl") ?? "").trim();
	const instagramUrl = String(form.get("instagramUrl") ?? "").trim();
	const tiktokUrl = String(form.get("tiktokUrl") ?? "").trim();
	const iconValue = form.get("icon");
	if (!appName || appName.length > 60) {
		return NextResponse.json({ error: "يجب أن يكون اسم التطبيق بين حرف واحد و60 حرفًا" }, { status: 400 });
	}
	if (emailFooter.length > 2000) {
		return NextResponse.json({ error: "يجب ألا يتجاوز تذييل البريد 2000 حرف" }, { status: 400 });
	}
	for (const [label, value] of [
		["الموقع الإلكتروني", websiteUrl],
		["إنستغرام", instagramUrl],
		["تيك توك", tiktokUrl],
	] as const) {
		if (value && !isValidHttpUrl(value)) {
			return NextResponse.json({ error: `رابط ${label} غير صالح` }, { status: 400 });
		}
	}
	const icon = isBrandingIcon(iconValue) && iconValue.size > 0 ? iconValue : null;
	if (icon && !BRANDING_ICON_TYPES.includes(icon.type)) {
		return NextResponse.json({ error: "استخدم صورة بصيغة PNG أو JPEG أو WebP أو GIF" }, { status: 400 });
	}
	if (icon && icon.size > MAX_BRANDING_ICON_SIZE) {
		return NextResponse.json({ error: "يجب ألا يتجاوز حجم الأيقونة 2 ميجابايت" }, { status: 413 });
	}

	try {
		return NextResponse.json(
			await updateBranding(env, { appName, icon, emailFooter, websiteUrl, instagramUrl, tiktokUrl }),
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "تعذر تحديث الهوية البصرية";
		const status = /يلزم ترخيص/.test(message) ? 403 : 500;
		return NextResponse.json({ error: message }, { status });
	}
}

function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}
