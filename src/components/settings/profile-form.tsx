"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authFetch } from "@/lib/auth/client";
import type { ProfileFormProps, ProfileFormResponse } from "./types";

export function ProfileForm({ initialName, initialResetEmail, email }: ProfileFormProps) {
	const [name, setName] = useState(initialName);
	const [resetEmail, setResetEmail] = useState(initialResetEmail);
	const [savedName, setSavedName] = useState(initialName);
	const [savedResetEmail, setSavedResetEmail] = useState(initialResetEmail);
	const [status, setStatus] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const hasChanges =
		name.trim() !== savedName ||
		resetEmail.trim() !== savedResetEmail;

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setStatus(null);

		try {
			const res = await authFetch("/api/settings/profile", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, resetEmail }),
			});
			const data = (await res.json()) as ProfileFormResponse;

			if (!res.ok) {
				setStatus(typeof data.error === "string" ? data.error : "تعذّر تحديث الحساب");
				return;
			}

			const nextName = data.user?.name ?? name.trim();
			const nextResetEmail = data.user?.resetEmail ?? "";
			setName(nextName);
			setResetEmail(nextResetEmail);
			setSavedName(nextName);
			setSavedResetEmail(nextResetEmail);
			setStatus("تم الحفظ");
		} catch (err) {
			setStatus(err instanceof Error ? err.message : "تعذّر تحديث الحساب");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="accountEmail">البريد الإلكتروني الحالي</Label>
				<Input id="accountEmail" value={email} type="email" readOnly aria-readonly="true" className="bg-neutral-50" />
			</div>
			<div className="space-y-2">
				<Label htmlFor="name">الاسم</Label>
				<Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
			</div>
			<div className="space-y-2">
				<Label htmlFor="resetEmail">البريد الإلكتروني للاسترداد</Label>
				<Input
					id="resetEmail"
					value={resetEmail}
					onChange={(event) => setResetEmail(event.target.value)}
					type="email"
					placeholder="recovery@example.com"
				/>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={loading || !hasChanges}>
					{loading ? "جارٍ الحفظ..." : "حفظ"}
				</Button>
				{status && <p className="text-sm text-neutral-500">{status}</p>}
			</div>
		</form>
	);
}
