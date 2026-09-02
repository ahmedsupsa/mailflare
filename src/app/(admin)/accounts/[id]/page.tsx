"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ManagedAccount } from "./types";
import {
	fetchManagedAccount,
	saveManagedAccount,
	uploadManagedAccountAvatar,
} from "./utils";

export default function AccountDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const [account, setAccount] = useState<ManagedAccount | null>(null);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [avatarVersion, setAvatarVersion] = useState(0);

	useEffect(() => {
		void fetchManagedAccount(id)
			.then(setAccount)
			.catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل الحساب"));
	}, [id]);

	async function saveDetails() {
		if (!account) return;
		setSaving(true);
		setMessage(null);
		try {
			await saveManagedAccount(account);
			setMessage("تم تحديث بيانات الحساب");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "تعذر تحديث الحساب");
		} finally {
			setSaving(false);
		}
	}

	async function uploadAvatar(file: File | undefined) {
		if (!file || !account) return;
		try {
			await uploadManagedAccountAvatar(account.id, file);
			setAccount({ ...account, hasAvatar: true });
			setAvatarVersion(Date.now());
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "تعذر تحديث الصورة الرمزية");
		}
	}

	if (!account) return <p className="text-sm text-neutral-500">{message ?? "جارٍ تحميل الحساب..."}</p>;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-medium text-neutral-900">التفاصيل</h1>
				<p className="mt-2 text-sm text-neutral-500">تحديث الملف الشخصي لهذا العضو وحالته.</p>
			</div>
			<section className="space-y-5 rounded-3xl bg-white p-6">
				<div className="flex items-center gap-4">
					<span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
						{account.name.charAt(0).toUpperCase()}
						{account.hasAvatar && (
							<img src={`/api/accounts/${id}/avatar?v=${avatarVersion}`} alt="" className="absolute inset-0 h-full w-full object-cover" />
						)}
					</span>
					<Label className="cursor-pointer">
						<span className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-200 px-3 text-sm">
							<Upload className="h-4 w-4" />
							تغيير الصورة الرمزية
						</span>
						<Input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
					</Label>
				</div>
				<div className="space-y-2">
					<Label htmlFor="account-email">البريد الإلكتروني</Label>
					<Input id="account-email" value={account.email} readOnly className="bg-neutral-50 text-neutral-500" />
				</div>
				<div className="space-y-2">
					<Label htmlFor="account-name">الاسم</Label>
					<Input id="account-name" value={account.name} onChange={(event) => setAccount({ ...account, name: event.target.value })} />
				</div>
				{account.canForwardEmail && <div className="space-y-2">
					<Label htmlFor="forwarding-email">البريد الإلكتروني لإعادة التوجيه (اختياري)</Label>
					<Input
						id="forwarding-email"
						type="email"
						value={account.forwardingEmail ?? ""}
						onChange={(event) => setAccount({ ...account, forwardingEmail: event.target.value || null })}
						placeholder="destination@example.com"
					/>
					<p className="text-xs leading-5 text-neutral-500">
						سيتم أيضًا إرسال البريد الوارد إلى وجهة توجيه البريد الإلكتروني هذه الموثّقة في Cloudflare.
					</p>
				</div>}
				<label className="flex items-center gap-3 text-sm">
					<Checkbox checked={!account.disabled} onChange={(event) => setAccount({ ...account, disabled: !event.target.checked })} />
					العضو مفعّل
				</label>
				<Button onClick={() => void saveDetails()} disabled={saving || !account.name.trim()}>
					{saving ? "جارٍ الحفظ..." : "حفظ التفاصيل"}
				</Button>
			</section>
			{message && <p className="text-sm text-neutral-500">{message}</p>}
		</div>
	);
}
