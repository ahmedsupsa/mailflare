import { authFetch } from "@/lib/auth/client";
import type {
	AccountDetail,
	AccountDetailResponse,
	AccountMailboxAccessItem,
	AccountMailboxAccessResponse,
	AccountMailboxItem,
	DomainOption,
	ManagedAccount,
	ManagedDomain,
	ManagedMailbox,
} from "./types";

export const permissionLabels: Record<NonNullable<AccountMailboxAccessItem["permission"]>, string> = {
	read_only: "قراءة فقط",
	send_as: "الإرسال كـ",
	send_on_behalf: "الإرسال نيابة عن",
	full_access: "وصول كامل",
};

export async function fetchAccountMailboxAccess(accountId: string): Promise<AccountMailboxAccessResponse> {
	const res = await authFetch(`/api/accounts/${accountId}/mailbox-access`);
	const json = (await res.json()) as AccountMailboxAccessResponse;
	if (!res.ok) throw new Error(json.error ?? "تعذر تحميل صلاحيات وصول الحساب");
	return json;
}

export async function fetchAccount(accountId: string): Promise<AccountDetail> {
	const res = await authFetch(`/api/accounts/${accountId}`);
	const json = (await res.json()) as AccountDetailResponse;
	if (!res.ok || !json.account) throw new Error(json.error ?? "تعذر تحميل الحساب");
	return json.account;
}

export async function updateAccount(
	accountId: string,
	input: { email: string; name: string; password?: string; disabled: boolean },
): Promise<void> {
	const res = await authFetch(`/api/accounts/${accountId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "تعذر تحديث الحساب");
}

export async function fetchDomains(): Promise<DomainOption[]> {
	const res = await authFetch("/api/domains");
	const json = (await res.json()) as { domains?: DomainOption[]; error?: string };
	if (!res.ok) throw new Error(json.error ?? "تعذر تحميل النطاقات");
	return json.domains ?? [];
}

export async function fetchAccountMailboxes(accountId: string): Promise<AccountMailboxItem[]> {
	const res = await authFetch(`/api/accounts/${accountId}/mailboxes`);
	const json = (await res.json()) as { mailboxes?: AccountMailboxItem[]; error?: string };
	if (!res.ok) throw new Error(json.error ?? "تعذر تحميل صناديق بريد الحساب");
	return json.mailboxes ?? [];
}

export async function createAccountMailbox(
	accountId: string,
	input: { domainId: string; localPart: string; displayName?: string },
): Promise<void> {
	const res = await authFetch(`/api/accounts/${accountId}/mailboxes`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(input),
	});
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "تعذر إنشاء صندوق البريد");
}

export async function grantAccountMailboxAccess(
	accountId: string,
	mailboxId: string,
	permission: NonNullable<AccountMailboxAccessItem["permission"]>,
): Promise<void> {
	const res = await authFetch(`/api/accounts/${accountId}/mailbox-access`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ mailboxId, permission }),
	});
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "تعذر تحديث الصلاحية");
}

export async function revokeAccountMailboxAccess(accountId: string, mailboxId: string): Promise<void> {
	const res = await authFetch(`/api/accounts/${accountId}/mailbox-access?mailboxId=${encodeURIComponent(mailboxId)}`, {
		method: "DELETE",
	});
	const json = (await res.json()) as { error?: string };
	if (!res.ok) throw new Error(json.error ?? "تعذرت إزالة الصلاحية");
}

export function getMailboxAddress(mailbox: Pick<AccountMailboxAccessItem, "localPart" | "hostname">): string {
	return `${mailbox.localPart}@${mailbox.hostname}`;
}

export function getMailboxLabel(mailbox: Pick<AccountMailboxAccessItem, "displayName" | "localPart">): string {
	return mailbox.displayName?.trim() || mailbox.localPart;
}

export async function fetchManagedAccount(accountId: string): Promise<ManagedAccount> {
	const response = await authFetch(`/api/accounts/${accountId}`);
	const data = (await response.json()) as { account?: ManagedAccount; error?: string };
	if (!response.ok || !data.account) throw new Error(data.error ?? "تعذر تحميل الحساب");
	return data.account;
}

export async function saveManagedAccount(account: ManagedAccount): Promise<void> {
	const response = await authFetch(`/api/accounts/${account.id}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			name: account.name,
			role: account.role,
			disabled: account.disabled,
			canManageMailboxes: account.canManageMailboxes,
			forwardingEmail: account.forwardingEmail,
		}),
	});
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذر تحديث الحساب");
}

export async function uploadManagedAccountAvatar(accountId: string, file: File): Promise<void> {
	const form = new FormData();
	form.set("file", file);
	const response = await authFetch(`/api/accounts/${accountId}/avatar`, { method: "POST", body: form });
	if (!response.ok) throw new Error("تعذر تحديث الصورة الرمزية");
}

export async function fetchManagedMailboxes(accountId: string): Promise<ManagedMailbox[]> {
	const response = await authFetch(`/api/accounts/${accountId}/mailboxes`);
	const data = (await response.json()) as { mailboxes?: ManagedMailbox[]; error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذر تحميل صناديق البريد");
	return data.mailboxes ?? [];
}

export async function fetchManagedDomains(): Promise<ManagedDomain[]> {
	const response = await authFetch("/api/domains");
	const data = (await response.json()) as { domains?: ManagedDomain[]; error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذر تحميل النطاقات");
	return data.domains ?? [];
}

export async function addManagedMailbox(
	account: ManagedAccount,
	input: { domainId: string; localPart: string },
): Promise<void> {
	const response = await authFetch("/api/mailboxes", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			ownerUserId: account.id,
			domainId: input.domainId,
			localPart: input.localPart,
			displayName: account.name,
			type: "personal",
		}),
	});
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذرت إضافة صندوق البريد");
}

export async function removeManagedMailbox(mailboxId: string): Promise<void> {
	const response = await authFetch(`/api/mailboxes/${mailboxId}`, { method: "DELETE" });
	const data = (await response.json()) as { error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذرت إزالة صندوق البريد");
}
