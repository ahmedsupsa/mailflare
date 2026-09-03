import { authFetch } from "@/lib/auth/client";
import type { MessageCountsDelta } from "@/hooks/types";

export type SnoozePreset = {
	label: string;
	value: string;
};

export function formatSnoozeDateTime(date: Date): string {
	const timezoneOffset = date.getTimezoneOffset() * 60_000;
	return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export function getSnoozePresets(now = new Date()): SnoozePreset[] {
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	const nextWeek = new Date(now);
	nextWeek.setDate(nextWeek.getDate() + 7);
	const nextMonth = new Date(now);
	nextMonth.setMonth(nextMonth.getMonth() + 1);

	return [
		{ label: "غدًا", value: formatSnoozeDateTime(tomorrow) },
		{ label: "الأسبوع القادم", value: formatSnoozeDateTime(nextWeek) },
		{ label: "الشهر القادم", value: formatSnoozeDateTime(nextMonth) },
	];
}

export async function snoozeMessage(messageId: string, snoozedUntil: string) {
	const response = await authFetch(`/api/messages/${messageId}/snooze`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ snoozedUntil: new Date(snoozedUntil).toISOString() }),
	});
	if (!response.ok) throw new Error("تعذر تأجيل الرسالة");
	window.dispatchEvent(new Event("mershhah:messages-changed"));
}

export function isMessageSnoozed(snoozedUntil?: string | null): boolean {
	return !!snoozedUntil && new Date(snoozedUntil) > new Date();
}

export async function unsnoozeMessage(messageId: string) {
	const response = await authFetch(`/api/messages/${messageId}/snooze`, { method: "DELETE" });
	if (!response.ok) throw new Error("تعذر إلغاء تأجيل الرسالة");
	window.dispatchEvent(new Event("mershhah:messages-changed"));
}

export async function toggleMessageStar(messageId: string) {
	const response = await authFetch(`/api/messages/${messageId}/star`, { method: "POST" });
	if (!response.ok) throw new Error("تعذر تحديث تمييز الرسالة بنجمة");
	const result = (await response.json()) as { starred: boolean };
	window.dispatchEvent(new Event("mershhah:message-counts-changed"));
	return result;
}

export function dispatchMessageCountsDelta(detail: MessageCountsDelta) {
	window.dispatchEvent(new CustomEvent<MessageCountsDelta>("mershhah:message-counts-delta", { detail }));
}
