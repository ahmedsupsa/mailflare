"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordClient() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token") ?? "";
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		if (password !== confirmPassword) {
			setError("كلمتا المرور غير متطابقتين");
			return;
		}
		setLoading(true);
		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
				signal: AbortSignal.timeout(20_000),
			});
			const data = (await response.json()) as { error?: string };
			if (!response.ok) {
				setError(data.error ?? "تعذر إعادة تعيين كلمة المرور");
				return;
			}
			setDone(true);
			setTimeout(() => router.replace("/login"), 2500);
		} catch {
			setError("تعذر الوصول إلى الخدمة. حاول مرة أخرى.");
		} finally {
			setLoading(false);
		}
	}

	if (!token) {
		return (
			<AuthShell
				icon={KeyRound}
				title="رابط غير صالح"
				description="رابط إعادة تعيين كلمة المرور غير صالح أو ناقص."
			>
				<Link href="/forgot-password" className="text-sm font-medium hover:underline">
					اطلب رابطًا جديدًا
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell icon={KeyRound} title="تعيين كلمة مرور جديدة" description="اختر كلمة مرور جديدة لحسابك.">
			{done ? (
				<p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
					تم تحديث كلمة المرور بنجاح. جارٍ تحويلك لتسجيل الدخول...
				</p>
			) : (
				<form onSubmit={onSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="password">كلمة المرور الجديدة</Label>
						<Input
							id="password"
							name="password"
							type="password"
							autoComplete="new-password"
							minLength={8}
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							minLength={8}
							value={confirmPassword}
							onChange={(event) => setConfirmPassword(event.target.value)}
							required
						/>
					</div>
					{error && (
						<p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
							{error}
						</p>
					)}
					<Button
						type="submit"
						className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
						disabled={loading}
					>
						{loading ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
