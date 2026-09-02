"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ForwardingEmailFormProps } from "./types";
import { updateForwardingEmail } from "./utils";

export function ForwardingEmailForm({ initialForwardingEmail }: ForwardingEmailFormProps) {
	const [forwardingEmail, setForwardingEmail] = useState(initialForwardingEmail);
	const [savedForwardingEmail, setSavedForwardingEmail] = useState(initialForwardingEmail);
	const [status, setStatus] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setStatus(null);
		try {
			const saved = await updateForwardingEmail(forwardingEmail);
			setForwardingEmail(saved);
			setSavedForwardingEmail(saved);
			setStatus("تم الحفظ");
		} catch (error) {
			setStatus(error instanceof Error ? error.message : "تعذّر تحديث البريد الإلكتروني لإعادة التوجيه");
		} finally {
			setSaving(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="forwardingEmail">البريد الإلكتروني الوجهة</Label>
				<Input
					id="forwardingEmail"
					value={forwardingEmail}
					onChange={(event) => setForwardingEmail(event.target.value)}
					type="email"
					placeholder="destination@example.com"
				/>
				<p className="text-xs leading-5 text-neutral-500">
					سيتم أيضًا إرسال البريد الوارد إلى وجهة Cloudflare Email Routing الموثّقة هذه.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={saving || forwardingEmail.trim() === savedForwardingEmail}>
					{saving ? "جارٍ الحفظ..." : "حفظ إعادة التوجيه"}
				</Button>
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
