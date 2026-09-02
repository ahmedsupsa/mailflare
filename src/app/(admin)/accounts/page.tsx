"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { authFetch } from "@/lib/auth/client";
import type { Account, AccountResponse, Domain } from "./types";

export default function AccountsPage() {
	const [accounts, setAccounts] = useState<Account[]>([]);
	const [domains, setDomains] = useState<Domain[]>([]);
	const [username, setUsername] = useState("");
	const [domainId, setDomainId] = useState("");
	const [role, setRole] = useState<"admin" | "user">("user");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const [message, setMessage] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	async function loadAccounts() {
		const response = await authFetch("/api/accounts");
		const data = (await response.json()) as AccountResponse;
		if (!response.ok) throw new Error(data.error ?? "تعذر تحميل أعضاء الفريق");
		setAccounts(data.accounts ?? []);
	}

	useEffect(() => {
		loadAccounts()
			.then(async () => {
				const response = await authFetch("/api/domains");
				const data = (await response.json()) as { domains?: Domain[]; error?: string };
				if (!response.ok) throw new Error(data.error ?? "تعذر تحميل النطاقات");
				setDomains(data.domains ?? []);
				setDomainId(data.domains?.[0]?.id ?? "");
			})
			.catch((error) => {
				setMessage(error instanceof Error ? error.message : "تعذر تحميل أعضاء الفريق");
			})
			.finally(() => setLoading(false));
	}, []);

	async function createAccount(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSaving(true);
		setMessage(null);
		try {
			const response = await authFetch("/api/accounts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, domainId, password, role }),
			});
			const data = (await response.json()) as AccountResponse;
			if (!response.ok) throw new Error(data.error ?? "تعذر إضافة العضو");
			setUsername("");
			setPassword("");
			setRole("user");
			setCreateOpen(false);
			await loadAccounts();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "تعذر إضافة العضو");
		} finally {
			setSaving(false);
		}
	}

	const filteredAccounts = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) return accounts;
		return accounts.filter(
			(account) => account.name.toLowerCase().includes(query) || account.email.toLowerCase().includes(query),
		);
	}, [accounts, search]);

	const adminCount = accounts.filter((account) => account.role === "admin").length;
	const selectedDomain = domains.find((domain) => domain.id === domainId);
	const emailPreview = username.trim() && selectedDomain ? `${username.trim()}@${selectedDomain.hostname}` : null;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-medium text-neutral-900">الفريق</h1>
					<p className="mt-2 text-sm text-neutral-500">
						أضف موظفيك وامنح كل واحد منهم بريده الإلكتروني الخاص وصلاحياته.
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<Plus className="h-4 w-4" />
					عضو جديد
				</Button>
			</div>

			{accounts.length > 0 && (
				<div className="flex flex-wrap items-center gap-3">
					<div className="flex h-11 flex-1 min-w-56 items-center gap-3 rounded-full bg-white px-4 text-neutral-600">
						<Search className="h-4 w-4 shrink-0 text-neutral-400" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="ابحث بالاسم أو البريد الإلكتروني"
							className="h-full min-w-0 flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
						/>
					</div>
					<span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-medium text-neutral-500">
						<Users className="h-3.5 w-3.5" />
						{accounts.length} {accounts.length === 1 ? "عضو" : "أعضاء"}
						{adminCount > 0 && (
							<>
								<span className="text-neutral-300">·</span>
								<ShieldCheck className="h-3.5 w-3.5" />
								{adminCount} {adminCount === 1 ? "مسؤول" : "مسؤولين"}
							</>
						)}
					</span>
				</div>
			)}

			{loading && <p className="text-sm text-neutral-500">جارٍ التحميل...</p>}

			{!loading && accounts.length === 0 && (
				<div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-6 py-16 text-center">
					<span className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
						<Users className="h-6 w-6" />
					</span>
					<div>
						<p className="font-semibold text-neutral-900">لا يوجد أعضاء في الفريق بعد</p>
						<p className="mt-1 max-w-sm text-sm text-neutral-500">
							أضف موظفيك الأوائل الآن — كل عضو يحصل تلقائيًا على بريد إلكتروني خاص به على نطاقك.
						</p>
					</div>
					<Button onClick={() => setCreateOpen(true)} className="mt-2">
						<Plus className="h-4 w-4" />
						إضافة أول عضو
					</Button>
				</div>
			)}

			{!loading && accounts.length > 0 && filteredAccounts.length === 0 && (
				<p className="rounded-3xl bg-white px-5 py-8 text-center text-sm text-neutral-500">
					لا توجد نتائج مطابقة لـ «{search}»
				</p>
			)}

			<div className="grid gap-3">
				{filteredAccounts.map((account) => (
					<Link
						key={account.id}
						href={`/accounts/${account.id}`}
						className="flex items-center gap-4 rounded-3xl bg-white p-5 transition-colors hover:bg-neutral-50/40"
					>
						<span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100 font-semibold text-neutral-800">
							{account.name.charAt(0).toUpperCase()}
							{account.hasAvatar && (
								<img
									src={`/api/accounts/${account.id}/avatar`}
									alt=""
									className="absolute inset-0 h-full w-full object-cover"
								/>
							)}
						</span>
						<span className="min-w-0 flex-1">
							<span className="flex items-center gap-2">
								<span className="truncate font-semibold text-neutral-900">{account.name}</span>
								<span
									className={`rounded-full px-2 py-0.5 text-xs font-medium ${
										account.role === "admin" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
									}`}
								>
									{account.role === "admin" ? "مسؤول" : "عضو"}
								</span>
								{account.disabled && (
									<span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
										معطّل
									</span>
								)}
							</span>
							<span className="block truncate text-sm text-neutral-500">{account.email}</span>
						</span>
						<ChevronLeft className="h-4 w-4 shrink-0 text-neutral-300 rtl:rotate-180" />
					</Link>
				))}
			</div>

			<Dialog open={createOpen} onOpenChange={setCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>إضافة عضو جديد للفريق</DialogTitle>
						<DialogDescription>
							سيحصل هذا العضو على بريد إلكتروني خاص به ويمكنه تسجيل الدخول بكلمة المرور التي تحددها له.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={createAccount} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="account-username">البريد الإلكتروني</Label>
							<div className="flex h-10 overflow-hidden rounded-md border border-neutral-200 bg-white">
								<Input
									id="account-username"
									value={username}
									onChange={(event) => setUsername(event.target.value)}
									placeholder="username"
									className="min-w-0 flex-1 rounded-none border-0 shadow-none"
									required
								/>
								<span className="flex items-center text-sm text-neutral-400">@</span>
								<Select
									aria-label="النطاق"
									value={domainId}
									onChange={(event) => setDomainId(event.target.value)}
									className="max-w-[55%] bg-transparent px-3 text-sm"
									required
								>
									<option value="">اختر نطاقًا</option>
									{domains.map((domain) => (
										<option key={domain.id} value={domain.id}>
											{domain.hostname}
										</option>
									))}
								</Select>
							</div>
							{emailPreview && (
								<p className="text-xs text-neutral-500">
									البريد الجديد سيكون: <span className="font-medium text-neutral-700">{emailPreview}</span>
								</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="account-password">كلمة المرور</Label>
							<Input
								id="account-password"
								type="password"
								minLength={8}
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="account-role">الدور</Label>
							<Select
								id="account-role"
								value={role}
								onChange={(event) => setRole(event.target.value as "admin" | "user")}
								className="h-10 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm"
							>
								<option value="user">عضو — صندوق بريده الخاص فقط</option>
								<option value="admin">مسؤول — يقدر يدير الفريق والإعدادات</option>
							</Select>
						</div>
						{message && <p className="text-sm text-red-600">{message}</p>}
						<Button type="submit" disabled={saving || !domainId}>
							{saving ? "جارٍ الإضافة..." : "إضافة العضو"}
						</Button>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
