"use client";

import { useEffect, useState } from "react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MailboxAutoReplySettings } from "./types";
import { updateMailboxAutoReply } from "./utils";

const defaultSettings: MailboxAutoReplySettings = {
	enabled: false,
	subject: "خارج المكتب",
	body: "",
};

export function MailboxAutoReplyForm() {
	const { selectedMailbox, setSelectedMailbox, isLoading } = useSelectedMailbox();
	const [settings, setSettings] = useState(defaultSettings);
	const [savedSettings, setSavedSettings] = useState(defaultSettings);
	const [status, setStatus] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const nextSettings = {
			enabled: selectedMailbox?.autoReplyEnabled ?? false,
			subject: selectedMailbox?.autoReplySubject ?? "خارج المكتب",
			body: selectedMailbox?.autoReplyBody ?? "",
		};
		setSettings(nextSettings);
		setSavedSettings(nextSettings);
		setStatus(null);
	}, [
		selectedMailbox?.id,
		selectedMailbox?.autoReplyEnabled,
		selectedMailbox?.autoReplySubject,
		selectedMailbox?.autoReplyBody,
	]);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedMailbox) return;
		if (settings.enabled && !settings.body.trim()) {
			setStatus("أدخل رسالة الرد التلقائي قبل تفعيله.");
			return;
		}
		setSaving(true);
		setStatus(null);
		try {
			const saved = await updateMailboxAutoReply(selectedMailbox.id, settings);
			setSettings(saved);
			setSavedSettings(saved);
			setSelectedMailbox({
				...selectedMailbox,
				autoReplyEnabled: saved.enabled,
				autoReplySubject: saved.subject,
				autoReplyBody: saved.body,
			});
			setStatus("تم الحفظ");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "تعذّر تحديث الرد التلقائي");
		} finally {
			setSaving(false);
		}
	}

	if (isLoading) return <p className="text-sm text-neutral-500">جارٍ تحميل صندوق البريد…</p>;
	if (!selectedMailbox) return <p className="text-sm text-neutral-500">اختر صندوق بريد لتكوين الرد التلقائي.</p>;

	const address = `${selectedMailbox.localPart}@${selectedMailbox.hostname}`;
	const canManage = selectedMailbox.permission === "full_access";
	const changed = JSON.stringify(settings) !== JSON.stringify(savedSettings);

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<label className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
				<Checkbox
					checked={settings.enabled}
					onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
					disabled={!canManage || saving}
				/>
				<span>
					<span className="block text-sm font-medium text-neutral-900">تفعيل الرد التلقائي لـ {address}</span>
					<span className="mt-1 block text-sm text-neutral-500">
						يتلقى كل مرسل ردًا تلقائيًا واحدًا على الأكثر كل 24 ساعة.
					</span>
				</span>
			</label>
			<div className="space-y-2">
				<Label htmlFor="autoReplySubject">الموضوع</Label>
				<Input
					id="autoReplySubject"
					value={settings.subject}
					onChange={(event) => setSettings({ ...settings, subject: event.target.value })}
					placeholder="خارج المكتب"
					disabled={!canManage || saving}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor="autoReplyBody">الرسالة</Label>
				<Textarea
					id="autoReplyBody"
					value={settings.body}
					onChange={(event) => setSettings({ ...settings, body: event.target.value })}
					placeholder="شكرًا لرسالتك. أنا غائب حاليًا وسأرد عند عودتي."
					rows={7}
					disabled={!canManage || saving}
				/>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={!canManage || saving || !changed}>
					{saving ? "جارٍ الحفظ..." : "حفظ الرد التلقائي"}
				</Button>
				{!canManage && <p className="text-sm text-neutral-500">الوصول الكامل مطلوب لتعديل الرد التلقائي.</p>}
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
