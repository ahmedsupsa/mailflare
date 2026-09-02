"use client";

import { createElement, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, Ban, BellOff, Mail, MailOpen, MoreVertical, Reply, ShieldAlert, Trash2 } from "lucide-react";
import { useCompose } from "@/components/compose/compose-context";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import type { MessageActionsProps } from "./types";
import {
	confirmTrashWithoutUnsubscribe,
	blockMessageContact,
	createReplyDraft,
	createTrashSenderRule,
	getMessageActionRedirect,
	getMoveMessageActions,
	openUnsubscribeUrl,
	runSingleMessageAction,
} from "./utils";

export function MessageActions({
	messageId,
	mailboxId,
	senderAddress,
	direction,
	status,
	read,
	unsubscribeUrl,
	subject,
	bodyText,
	ownAddress,
}: MessageActionsProps) {
	const router = useRouter();
	const { openDraftComposer } = useCompose();
	const [pendingAction, setPendingAction] = useState<
		BulkMessageAction | "unsubscribe" | "reply" | "block" | null
	>(null);
	const [error, setError] = useState<string | null>(null);
	const [moreOpen, setMoreOpen] = useState(false);

	async function runAction(action: BulkMessageAction) {
		setMoreOpen(false);
		setPendingAction(action);
		setError(null);
		try {
			await runSingleMessageAction(messageId, action);
			const redirect = getMessageActionRedirect(action, direction);
			if (redirect) router.push(redirect);
			router.refresh();
		} catch {
			setError("تعذر تحديث الرسالة");
		} finally {
			setPendingAction(null);
		}
	}

	async function onUnsubscribe() {
		setMoreOpen(false);
		setError(null);
		if (unsubscribeUrl) {
			openUnsubscribeUrl(unsubscribeUrl);
			return;
		}

		if (!confirmTrashWithoutUnsubscribe()) return;
		setPendingAction("unsubscribe");
		if (!mailboxId) {
			setError("تعذر إنشاء قاعدة النقل إلى المهملات");
			setPendingAction(null);
			return;
		}

		try {
			await createTrashSenderRule({ mailboxId, senderAddress });
			await runAction("trash");
		} catch {
			setError("تعذر إنشاء قاعدة النقل إلى المهملات");
			setPendingAction(null);
		}
	}

	async function handleReply() {
		setPendingAction("reply");
		setError(null);
		try {
			const draftId = await createReplyDraft({
				mailboxId,
				senderAddress,
				ownAddress,
				subject,
				bodyText,
			});
			openDraftComposer(draftId);
		} catch (replyError) {
			setError(replyError instanceof Error ? replyError.message : "تعذر بدء الرد");
		} finally {
			setPendingAction(null);
		}
	}

	async function onBlockContact() {
		setMoreOpen(false);
		setError(null);
		if (!mailboxId) {
			setError("تعذر حظر جهة الاتصال");
			return;
		}

		setPendingAction("block");
		try {
			await blockMessageContact({ mailboxId, senderAddress });
			await runSingleMessageAction(messageId, "trash");
			router.push("/trash");
			router.refresh();
		} catch (blockError) {
			setError(blockError instanceof Error ? blockError.message : "تعذر حظر جهة الاتصال");
		} finally {
			setPendingAction(null);
		}
	}

	const disabled = pendingAction !== null;
	const markAction: BulkMessageAction = read ? "unread" : "read";
	const moveActions = getMoveMessageActions(status, direction);

	return (
		<div className="flex items-center gap-3 text-neutral-600">
			{error && <span className="text-xs text-red-600">{error}</span>}
			<div className="flex items-center gap-2">
				<Tooltip label="رد">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						aria-label="رد"
						disabled={disabled}
						onClick={handleReply}
					>
						<Reply className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label="أرشفة">
					<Button
						variant="ghost"
						size="sm"
						aria-label="أرشفة"
						disabled={disabled || status === "archived"}
						onClick={() => runAction("archive")}
					>
						<Archive className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label="الإبلاغ عن بريد مزعج">
					<Button
						variant="ghost"
						size="sm"
						aria-label="الإبلاغ عن بريد مزعج"
						disabled={disabled || status === "spam" || direction !== "inbound"}
						onClick={() => runAction("spam")}
					>
						<ShieldAlert className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label="حذف">
					<Button
						variant="ghost"
						size="sm"
						aria-label="نقل إلى المهملات"
						disabled={disabled || status === "trash"}
						onClick={() => runAction("trash")}
					>
						<Trash2 className="h-5 w-5" />
					</Button>
				</Tooltip>
				<Tooltip label={read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}>
					<Button
						variant="ghost"
						size="sm"
						aria-label={read ? "تحديد كغير مقروءة" : "تحديد كمقروءة"}
						disabled={disabled}
						onClick={() => runAction(markAction)}
					>
						{read ? <Mail className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
					</Button>
				</Tooltip>
				<div className="relative">
					<Tooltip label="مزيد من الإجراءات">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label="مزيد من الإجراءات"
							aria-expanded={moreOpen}
							disabled={disabled}
							onClick={() => setMoreOpen((open) => !open)}
						>
							<MoreVertical className="h-5 w-5" />
						</Button>
					</Tooltip>
					{moreOpen && (
						<div className="absolute end-0 z-20 mt-2 w-54 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg">
							{direction === "inbound" && (
								<>
									<button
										type="button"
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:text-neutral-400"
									disabled={!unsubscribeUrl && status === "trash"}
									onClick={() => void onUnsubscribe()}
								>
									<BellOff className="h-4 w-4 shrink-0" />
									إلغاء الاشتراك
									</button>
									<button
										type="button"
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
										onClick={() => void onBlockContact()}
									>
										<Ban className="h-4 w-4" />
										حظر جهة الاتصال
									</button>
							<hr className="my-1 border-neutral-100" />
								</>
							)}
							<p className="mt-1 px-3 pb-1 pt-2 text-sm font-medium text-neutral-500">
								نقل إلى
							</p>
							{moveActions.map((item) => (
								<button
									key={item.action}
									type="button"
									className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-neutral-700 hover:bg-neutral-100"
									onClick={() => void runAction(item.action)}
								>
									{createElement(item.icon, { size: 16 })}
									{item.label}
								</button>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
