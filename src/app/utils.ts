import { FileText, Inbox, MailCheck, Send, ShieldAlert, Trash2 } from "lucide-react";
import type { HomeAction, LandingNavItem, LandingStat, MailPreview, SidebarItem } from "./types";

export const landingNavItems: LandingNavItem[] = [
	{ href: "#workflow", label: "Workflow" },
	{ href: "#domains", label: "Domains" },
	{ href: "#api", label: "API" },
];

export const sidebarItems: SidebarItem[] = [
	{ label: "البريد الوارد", icon: Inbox, active: true, count: "18" },
	{ label: "المرسل", icon: Send },
	{ label: "المسودات", icon: FileText, count: "4" },
	{ label: "البريد العشوائي", icon: ShieldAlert },
	{ label: "المهملات", icon: Trash2 },
];

export const heroMessages: MailPreview[] = [
	{
		icon: MailCheck,
		sender: "postmaster@northline.dev",
		subject: "تمت مطابقة المسار",
		preview: "تم تسليم البريد الوارد إلى الدعم بعد التحقق من DNS.",
		badge: "وارد",
	},
	{
		icon: MailCheck,
		sender: "ops@halcyon.tools",
		subject: "تم قبول الإرسال عبر API",
		preview: "تم وضع الرسالة في قائمة الانتظار عبر مفتاح API الخاص بالإنتاج.",
		badge: "مرسل",
	},
	{
		icon: MailCheck,
		sender: "alerts@marketmesh.io",
		subject: "تم تسليم Webhook",
		preview: "وصلت حمولة الحدث إلى نقطة نهاية مساحة عمل الفوترة الخاصة بك.",
		badge: "تنبيه",
	},
	{
		icon: MailCheck,
		sender: "admin@statuscheck.dev",
		subject: "تم تجهيز صندوق البريد",
		preview: "صندوق بريد التوجيه الجديد جاهز لردود العملاء.",
		badge: "مسؤول",
	},
];

export const inboxStats: LandingStat[] = [
	{ value: "24ms", label: "routing rule lookup" },
	{ value: "7", label: "active domains" },
	{ value: "1.8k", label: "messages tracked this week" },
];

export const deliverySignals = [
	"DNS setup status before mail starts moving",
	"Mailbox-first routing for support and product teams",
	"API keys and webhooks managed beside the inbox",
];

export function getHomeActions(isLoggedIn: boolean): HomeAction[] {
	if (isLoggedIn) {
		return [{ href: "/inbox", label: "لوحة التحكم", variant: "default" }];
	}

	return [{ href: "/login", label: "تسجيل الدخول", variant: "default" }];
}
