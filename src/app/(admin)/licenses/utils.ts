import { Building2, Sparkles } from "lucide-react";
import type { LicensePlan } from "./types";
import { authFetch } from "@/lib/auth/client";
import { LICENSE_STATUS_CHANGED_EVENT } from "@/lib/licenses/constants";
import type { ActivatableLicensePlan, LicenseAction, LicenseResponse } from "./types";

export const LICENSE_PLANS: LicensePlan[] = [
	{
		name: "Pro",
		price: 19,
		originalPrice: 39,
		description: "ترخيص دائم لحساب واحد، يشمل سنة واحدة من تحديثات المنتج.",
		features: ["تخصيص الهوية المرئية", "جميع ميزات Pro المستقبلية", "سنة واحدة من التحديثات", "احتفظ بالنسخة المرخصة إلى الأبد"],
		icon: Sparkles,
		checkoutUrl: "https://app.paymug.co/buy/mailflare-pro",
	},
	{
		name: "Team",
		price: 249,
		description: "ترخيص دائم متعدد الحسابات يشمل كل إمكانيات Pro وسنة واحدة من التحديثات.",
		features: ["كل ما في Pro", "إضافة حسابات أخرى وإدارتها", "الوصول المشترك لصناديق البريد عند توفره", "سنة واحدة من التحديثات", "احتفظ بالنسخة المرخصة إلى الأبد"],
		icon: Building2,
		checkoutUrl: "https://app.paymug.co/buy/mailflare-team",
	},
];

export async function loadLicenseStatus(): Promise<NonNullable<LicenseResponse["license"]>> {
	const response = await authFetch("/api/licenses");
	const data = (await response.json()) as LicenseResponse;
	if (!response.ok || !data.license) throw new Error(data.error ?? "تعذر تحميل حالة الترخيص");
	return data.license;
}

export async function runLicenseAction(
	action: LicenseAction,
	licenseKey: string,
	plan?: ActivatableLicensePlan,
): Promise<NonNullable<LicenseResponse["license"]>> {
	const response = await authFetch(`/api/licenses/${action}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ licenseKey, ...(plan ? { plan } : {}) }),
	});
	const data = (await response.json()) as LicenseResponse;
	if (!response.ok || !data.license) throw new Error(data.error ?? "فشل طلب الترخيص");
	window.dispatchEvent(new Event(LICENSE_STATUS_CHANGED_EVENT));
	return data.license;
}

export function formatLicensePlan(plan: string): string {
	return plan === "team" ? "Team" : plan === "pro" ? "Pro" : "المجتمعي";
}

export function formatLicenseDate(value: Date | string | null): string | null {
	if (!value) return null;
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
