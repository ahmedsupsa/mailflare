import type { AccountSettingsNavItem } from "./account-settings-nav-types";

export const accountSettingsNavItems: AccountSettingsNavItem[] = [
	{ segment: "", label: "التفاصيل" },
	{ segment: "permissions", label: "الصلاحيات" },
	{ segment: "mailboxes", label: "صناديق البريد" },
];

export function getAccountSettingsHref(accountId: string, segment: AccountSettingsNavItem["segment"]): string {
	return `/accounts/${accountId}${segment ? `/${segment}` : ""}`;
}

export function isActiveAccountSettingsPath(pathname: string, href: string): boolean {
	return pathname === href;
}
