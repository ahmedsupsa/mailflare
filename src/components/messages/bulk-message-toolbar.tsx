"use client";

import { Archive, Mail, MailOpen, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { BulkMessageToolbarProps } from "./types";

export function BulkMessageToolbar({
	selectedCount,
	hasUnreadSelection,
	hideSelectedCount = false,
	onAction,
	onClearSelection,
	pending,
}: BulkMessageToolbarProps) {
	return (
		<div className="flex min-w-0 items-center gap-2 text-neutral-600 w-full">
			{!hideSelectedCount && (
				<span className="mr-2 text-sm font-medium text-neutral-800">
					{selectedCount} محدد
				</span>
			)}
			<Tooltip label="أرشفة">
				<Button variant="ghost" size="sm" onClick={() => onAction("archive")} disabled={pending} aria-label="أرشفة">
					<Archive className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label="الإبلاغ عن بريد مزعج">
				<Button variant="ghost" size="sm" onClick={() => onAction("spam")} disabled={pending} aria-label="الإبلاغ عن بريد مزعج">
					<ShieldAlert className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label="حذف">
				<Button variant="ghost" size="sm" onClick={() => onAction("trash")} disabled={pending} aria-label="حذف">
					<Trash2 className="h-4 w-4" />
				</Button>
			</Tooltip>
			<Tooltip label={hasUnreadSelection ? "تحديد كمقروءة" : "تحديد كغير مقروءة"}>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onAction(hasUnreadSelection ? "read" : "unread")}
					disabled={pending}
					aria-label={hasUnreadSelection ? "تحديد كمقروءة" : "تحديد كغير مقروءة"}
				>
					{hasUnreadSelection ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
				</Button>
			</Tooltip>
			<span className="flex-1" />
			<Tooltip label="نقل الرسائل المحددة">
					<Select
						className="bg-white text-xs font-medium py-2 text-neutral-700 outline-none"
						disabled={pending}
						defaultValue=""
						aria-label="نقل الرسائل المحددة"
						onChange={(event) => {
							if (!event.target.value) return;
							onAction(event.target.value as BulkMessageAction);
							event.target.value = "";
						}}
					>
						<option value="">نقل إلى</option>
						<option value="archive">الأرشيف</option>
						<option value="spam">البريد المزعج</option>
						<option value="trash">المهملات</option>
					</Select>
			</Tooltip>
			<Tooltip label="مسح التحديد">
				<Button variant="ghost" size="sm" onClick={onClearSelection} disabled={pending} aria-label="مسح التحديد">
					<X className="h-4 w-4" />
				</Button>
			</Tooltip>
		</div>
	);
}
