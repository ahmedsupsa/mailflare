"use client";

import { useEffect, useState } from "react";
import { useSelectedMailbox } from "@/components/mailbox-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMailboxSignature } from "./utils";

export function MailboxSignatureForm() {
	const { selectedMailbox, setSelectedMailbox, isLoading } = useSelectedMailbox();
	const [signature, setSignature] = useState("");
	const [savedSignature, setSavedSignature] = useState("");
	const [status, setStatus] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const nextSignature = selectedMailbox?.signature ?? "";
		setSignature(nextSignature);
		setSavedSignature(nextSignature);
		setStatus(null);
	}, [selectedMailbox?.id, selectedMailbox?.signature]);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!selectedMailbox) return;
		setSaving(true);
		setStatus(null);
		try {
			const saved = await updateMailboxSignature(selectedMailbox.id, signature);
			setSignature(saved);
			setSavedSignature(saved);
			setSelectedMailbox({ ...selectedMailbox, signature: saved });
			setStatus("تم الحفظ");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "تعذّر تحديث التوقيع");
		} finally {
			setSaving(false);
		}
	}

	if (isLoading) return <p className="text-sm text-neutral-500">جارٍ تحميل صندوق البريد…</p>;
	if (!selectedMailbox) return <p className="text-sm text-neutral-500">اختر صندوق بريد لتكوين توقيعه.</p>;

	const address = `${selectedMailbox.localPart}@${selectedMailbox.hostname}`;
	const canManage = selectedMailbox.permission === "full_access";

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="mailboxSignature">التوقيع لـ {address}</Label>
				<Textarea
					id="mailboxSignature"
					value={signature}
					onChange={(event) => setSignature(event.target.value)}
					placeholder={"اسمك\nالدور أو الشركة\nبيانات التواصل"}
					rows={6}
					disabled={!canManage || saving}
				/>
				<p className="text-xs leading-5 text-neutral-500">
					تتم إضافة هذا التوقيع عند الإنشاء من صندوق البريد المحدد.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={!canManage || saving || signature.trim() === savedSignature}>
					{saving ? "جارٍ الحفظ..." : "حفظ التوقيع"}
				</Button>
				{!canManage && <p className="text-sm text-neutral-500">الوصول الكامل مطلوب لتعديل هذا التوقيع.</p>}
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
