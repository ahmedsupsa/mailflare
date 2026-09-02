import type { SettingsNavSection } from "./settings-nav-types";

export const settingsNavSections: SettingsNavSection[] = [
	{
		label: "الإعدادات",
		items: [
			{
				href: "/settings/account",
				label: "الحساب",
			},
			{
				href: "/settings/rules",
				label: "القواعد",
			},
		],
	},
	{
		label: "صندوق البريد",
		items: [
			{
				href: "/settings/auto-reply",
				label: "الرد التلقائي",
			},
			{
				href: "/settings/import",
				label: "استيراد",
			},
			{
				href: "/settings/export",
				label: "تصدير",
			},
		],
	},
];

export function isActiveSettingsPath(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}
