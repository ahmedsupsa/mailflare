"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ManagedAccount } from "../types";
import { fetchManagedAccount, saveManagedAccount } from "../utils";

export default function AccountPermissionsPage() {
	const { id } = useParams<{ id: string }>();
	const [account, setAccount] = useState<ManagedAccount | null>(null);
	const [saving, setSaving] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	useEffect(() => {
		void fetchManagedAccount(id)
			.then(setAccount)
			.catch((error) => setMessage(error instanceof Error ? error.message : "تعذر تحميل الصلاحيات"));
	}, [id]);

	async function savePermissions() {
		if (!account) return;
		setSaving(true);
		setMessage(null);
		try {
			await saveManagedAccount(account);
			setMessage("تم تحديث الصلاحيات");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "تعذر تحديث الصلاحيات");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-medium text-neutral-900">الصلاحيات</h1>
				<p className="mt-2 text-sm text-neutral-500">التحكم فيما يمكن لهذا الحساب إدارته.</p>
			</div>
			<div className="overflow-hidden rounded-3xl bg-white">
				<table className="w-full text-start">
					<thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-500">
						<tr>
							<th className="px-5 py-3">الصلاحية</th>
							<th className="w-28 px-5 py-3 text-center">مسموح</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-neutral-100">
						<tr>
							<td className="px-5 py-4">
								<p className="text-sm font-semibold text-neutral-900">صلاحية المسؤول</p>
								<p className="mt-1 text-xs text-neutral-500">الوصول إلى صفحات الإدارة وإدارة إعدادات الفريق.</p>
							</td>
							<td className="px-5 py-4 text-center">
								<Checkbox
									aria-label="السماح بصلاحية المسؤول"
									checked={account?.role === "admin"}
									disabled={!account}
									onChange={(event) => account && setAccount({ ...account, role: event.target.checked ? "admin" : "user" })}
								/>
							</td>
						</tr>
						<tr>
							<td className="px-5 py-4">
								<p className="text-sm font-semibold text-neutral-900">إدارة صناديق البريد</p>
								<p className="mt-1 text-xs text-neutral-500">السماح لهذا الحساب بإضافة صناديق بريده الخاصة وإزالتها.</p>
							</td>
							<td className="px-5 py-4 text-center">
								<Checkbox
									aria-label="السماح بإدارة صناديق البريد"
									checked={account?.canManageMailboxes ?? false}
									disabled={!account}
									onChange={(event) => account && setAccount({ ...account, canManageMailboxes: event.target.checked })}
								/>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			<Button onClick={() => void savePermissions()} disabled={!account || saving}>
				{saving ? "جارٍ الحفظ..." : "حفظ الصلاحيات"}
			</Button>
			{message && <p className="text-sm text-neutral-500">{message}</p>}
		</div>
	);
}
