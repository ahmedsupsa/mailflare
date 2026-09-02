"use client";

import Link from "next/link";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordClient() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [sent, setSent] = useState(false);

	async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setLoading(true);
		setError(null);
		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
				signal: AbortSignal.timeout(20_000),
			});
			const data = (await response.json()) as { message?: string; error?: string };
			if (!response.ok) {
				setError(data.error ?? "تعذر إرسال الطلب");
				return;
			}
			setMessage(data.message ?? "تحقق من بريدك البديل.");
			setSent(true);
		} catch {
			setError("تعذر الوصول إلى الخدمة. حاول مرة أخرى.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<AuthShell
			icon={KeyRound}
			title="استرجاع كلمة المرور"
			description="أدخل بريدك الإلكتروني، وسنرسل رابط إعادة تعيين كلمة المرور إلى بريدك البديل المسجّل."
			footer={
				<Link href="/login" className="hover:underline">
					الرجوع إلى تسجيل الدخول
				</Link>
			}
		>
			{sent ? (
				<p className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
					{message}
				</p>
			) : (
				<form onSubmit={onSubmit} className="space-y-5">
					<div className="space-y-2">
						<Label htmlFor="email">البريد الإلكتروني</Label>
						<Input
							id="email"
							name="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
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
						{loading ? "جارٍ الإرسال..." : "إرسال رابط إعادة التعيين"}
					</Button>
				</form>
			)}
		</AuthShell>
	);
}
