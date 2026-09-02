"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangePasswordForm } from "./change-password-form";
import { ForwardingEmailForm } from "./forwarding-email-form";
import { MailboxSignatureForm } from "./mailbox-signature-form";
import { ProfileForm } from "./profile-form";
import { ProfileAvatarForm } from "./profile-avatar-form";
import type { AccountSettingsResponse } from "./types";
import { loadAccountSettings } from "./utils";

export function AccountSettings() {
	const [user, setUser] = useState<AccountSettingsResponse["user"]>();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		loadAccountSettings()
			.then((nextUser) => {
				if (!cancelled) setUser(nextUser);
			})
			.catch((err) => {
				if (!cancelled) setError(err instanceof Error ? err.message : "تعذّر تحميل الحساب");
			});

		return () => {
			cancelled = true;
		};
	}, []);

	if (error) {
		return <p className="py-8 text-sm text-red-600">{error}</p>;
	}

	if (!user) {
		return (
			<div className="space-y-6 py-4">
				<Skeleton className="h-9 w-40" />
				<Skeleton className="h-72 w-full rounded-3xl" />
			</div>
		);
	}

	return (
		<div className="space-y-8 py-4">
			<div>
				<h1 className="text-3xl font-medium text-neutral-900">الحساب</h1>
				<p className="mt-1 text-sm text-neutral-500">إدارة تفاصيل حسابك وكلمة مرور تسجيل الدخول.</p>
			</div>

			<Card className="rounded-3xl border-0 bg-white px-6">
				<CardHeader>
					<CardTitle>تفاصيل الحساب</CardTitle>
					<CardDescription>بريدك الإلكتروني الحالي مرتبط بهذا الحساب ولا يمكن تغييره من هنا.</CardDescription>
				</CardHeader>
				<CardContent className="pb-6">
					<div className="mb-6 flex items-center gap-4 border-b border-neutral-100 pb-6">
						<ProfileAvatarForm name={user.name} />
						<div>
							<p className="text-sm font-medium text-neutral-900">الصورة الشخصية</p>
							<p className="mt-1 text-sm text-neutral-500">اختر صورة لعرضها في جميع أنحاء حسابك.</p>
						</div>
					</div>
					<ProfileForm
						initialName={user.name}
						initialResetEmail={user.resetEmail ?? ""}
						email={user.email}
					/>
				</CardContent>
			</Card>

			{user.canForwardEmail && (
				<Card className="rounded-3xl border-0 bg-white px-6">
					<CardHeader>
						<CardTitle>البريد الإلكتروني لإعادة التوجيه</CardTitle>
						<CardDescription>إرسال نسخة من الرسائل الواردة إلى عنوان بريد إلكتروني آخر.</CardDescription>
					</CardHeader>
					<CardContent className="pb-6">
						<ForwardingEmailForm initialForwardingEmail={user.forwardingEmail ?? ""} />
					</CardContent>
				</Card>
			)}

			<Card className="rounded-3xl border-0 bg-white px-6">
				<CardHeader>
					<CardTitle>توقيع البريد الإلكتروني</CardTitle>
					<CardDescription>تكوين التوقيع لصندوق البريد المحدد أعلاه.</CardDescription>
				</CardHeader>
				<CardContent className="pb-6">
					<MailboxSignatureForm />
				</CardContent>
			</Card>

			<Card className="rounded-3xl border-0 bg-white px-6">
				<CardHeader>
					<CardTitle>تغيير كلمة المرور</CardTitle>
					<CardDescription>استخدم 8 أحرف على الأقل لكلمة المرور الجديدة.</CardDescription>
				</CardHeader>
				<CardContent className="pb-6">
					<ChangePasswordForm />
				</CardContent>
			</Card>
		</div>
	);
}
