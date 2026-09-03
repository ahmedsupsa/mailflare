"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContactDetailsRecord, ContactDetailsTriggerProps } from "./contact-details-types";
import {
	fetchContactDetails,
	getContactInitial,
	updateContactName,
} from "./contact-details-utils";

export function ContactDetailsTrigger({
	mailboxId,
	address,
	name,
	className,
}: ContactDetailsTriggerProps) {
	const [open, setOpen] = useState(false);
	const [shownName, setShownName] = useState(name);
	const [contact, setContact] = useState<ContactDetailsRecord | null>(null);
	const [displayName, setDisplayName] = useState(name);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setShownName(name);
	}, [name]);

	useEffect(() => {
		if (!open || !mailboxId) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchContactDetails(mailboxId, address)
			.then((nextContact) => {
				if (cancelled) return;
				setContact(nextContact);
				setDisplayName(nextContact.displayName ?? shownName);
			})
			.catch((loadError) => {
				if (!cancelled) setError(loadError instanceof Error ? loadError.message : "تعذر تحميل جهة الاتصال");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [address, mailboxId, open, shownName]);

	async function saveContact() {
		if (!mailboxId || !displayName.trim()) return;
		setSaving(true);
		setError(null);
		try {
			const updated = await updateContactName(mailboxId, address, displayName);
			const nextName = updated.displayName ?? displayName.trim();
			setContact(updated);
			setShownName(nextName);
			setOpen(false);
			window.dispatchEvent(new CustomEvent("mershhah:contact-changed", {
				detail: { email: updated.email, displayName: nextName },
			}));
		} catch (saveError) {
			setError(saveError instanceof Error ? saveError.message : "تعذر تحديث جهة الاتصال");
		} finally {
			setSaving(false);
		}
	}

	if (!mailboxId) return <span className={className}>{shownName}</span>;

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className={`${className ?? ""} rounded-sm text-start hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-200`}
			>
				{shownName}
			</button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>تفاصيل جهة الاتصال</DialogTitle>
						<DialogDescription>تحديث الطريقة التي تظهر بها جهة الاتصال هذه في بريدك.</DialogDescription>
					</DialogHeader>
					<div className="space-y-5">
						<div className="flex items-center gap-4">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-lg font-semibold text-neutral-800">
								{getContactInitial(shownName, address)}
							</div>
							<div className="min-w-0">
								<p className="truncate font-medium text-neutral-900">{shownName}</p>
								<p className="truncate text-sm text-neutral-500">{contact?.email ?? address}</p>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="contact-display-name">الاسم</Label>
							<Input
								id="contact-display-name"
								value={displayName}
								onChange={(event) => setDisplayName(event.target.value)}
								disabled={loading || saving}
							/>
						</div>
						<div className="grid gap-3 rounded-lg bg-neutral-50 p-3 text-sm sm:grid-cols-2">
							<div>
								<p className="text-xs font-medium uppercase text-neutral-400">المصدر</p>
								<p className="mt-1 capitalize text-neutral-700">{contact?.source ?? "البريد الإلكتروني"}</p>
							</div>
							<div>
								<p className="text-xs font-medium uppercase text-neutral-400">آخر ظهور</p>
								<p className="mt-1 text-neutral-700">
									{contact?.lastSeenAt ? dayjs(contact.lastSeenAt).format("MMM DD, YYYY") : "غير معروف"}
								</p>
							</div>
							{contact?.blocked && (
								<p className="text-sm font-medium text-red-600">جهة اتصال محظورة</p>
							)}
						</div>
						{error && <p className="text-sm text-red-600">{error}</p>}
						<Button
							type="button"
							onClick={saveContact}
							disabled={loading || saving || !displayName.trim()}
						>
							{saving ? "جارٍ الحفظ..." : "حفظ جهة الاتصال"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
