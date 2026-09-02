"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileField } from "@/components/auth/turnstile";
import { submitLogin } from "./utils";

export function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileReset, setTurnstileReset] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { ok, data } = await submitLogin(new FormData(e.currentTarget));
      if (!ok) {
        setError(data.error ?? "فشل تسجيل الدخول");
        setTurnstileReset((value) => value + 1);
        return;
      }
      router.replace(data.redirect ?? "/inbox");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof DOMException && error.name === "TimeoutError"
          ? "انتهت مهلة تسجيل الدخول. يرجى المحاولة مرة أخرى."
          : "تعذر الوصول إلى خدمة تسجيل الدخول. يرجى المحاولة مرة أخرى.",
      );
      setTurnstileReset((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      icon={Mail}
      title="تسجيل الدخول"
      description="افتح بريدك الإلكتروني وتابع من نفس مساحة عمل البريد الوارد."
    >
      <form method="post" onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">البريد الإلكتروني</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">كلمة المرور</Label>
            <Link href="/forgot-password" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
        <TurnstileField resetSignal={turnstileReset} />
        <Button
          type="submit"
          className="h-11 w-full rounded-full px-6 active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? "جارٍ تسجيل الدخول..." : "تسجيل الدخول"}
        </Button>
      </form>
    </AuthShell>
  );
}
