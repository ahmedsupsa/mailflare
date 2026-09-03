import type { BulkMessageAction } from "@/app/api/messages/bulk/types";
import { authFetch } from "@/lib/auth/client";
import { getEmailAddress } from "@/lib/email/address";
import { getLatestEmailContent } from "@/lib/email/reply-content-utils";
import type {
  BlockMessageContactInput,
  MoveMessageActionItem,
  ReplyDraftInput,
  TrashSenderRuleInput,
} from "./types";
import {
  ArchiveIcon,
  Inbox,
  InboxIcon,
  ShieldAlertIcon,
  ShieldIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";

export function getMessageBackHref(
  direction: "inbound" | "outbound",
  status: string,
) {
  if (status === "trash") return "/trash";
  if (status === "spam") return "/spam";
  if (status === "archived") return "/archived";
  if (status === "draft") return "/drafts";
  return direction === "inbound" ? "/inbox" : "/sent";
}

export async function runSingleMessageAction(
  messageId: string,
  action: BulkMessageAction,
) {
  const response = await authFetch("/api/messages/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageIds: [messageId], action }),
  });

  if (!response.ok) {
    throw new Error("تعذر تحديث الرسالة");
  }

  window.dispatchEvent(new Event("mershhah:messages-changed"));
}

export function openUnsubscribeUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function confirmTrashWithoutUnsubscribe() {
  return window.confirm(
    "لا يوفر هذا البريد الإلكتروني رابطًا لإلغاء الاشتراك. سيتم نقله إلى المهملات، وستُنقل أيضًا الرسائل المستقبلية من هذا المرسل إلى المهملات.",
  );
}

export async function createTrashSenderRule({
  mailboxId,
  senderAddress,
}: TrashSenderRuleInput) {
  const sender = getEmailAddress(senderAddress).trim().toLowerCase();
  if (!sender) throw new Error("عنوان المرسل مطلوب");

  const response = await authFetch("/api/routing-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      matchField: "email",
      matchOperator: "exact",
      matchValue: sender,
      destination: "trash",
      priority: 0,
    }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok)
    throw new Error(data.error ?? "تعذر إنشاء قاعدة النقل إلى المهملات");
}

export async function blockMessageContact({
  mailboxId,
  senderAddress,
}: BlockMessageContactInput) {
  const response = await authFetch("/api/contacts/block", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mailboxId, address: senderAddress }),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(data.error ?? "تعذر حظر جهة الاتصال");
}

export function getMoveMessageActions(
  status: string,
  direction: "inbound" | "outbound",
): MoveMessageActionItem[] {
  const actions: MoveMessageActionItem[] = [];
  if (status === "archived" && direction === "inbound") {
    actions.push({ action: "inbox", label: "البريد الوارد", icon: InboxIcon });
  }
  if (status !== "archived")
    actions.push({ action: "archive", label: "الأرشيف", icon: ArchiveIcon });
  if (status !== "spam")
    actions.push({ action: "spam", label: "البريد المزعج", icon: ShieldAlertIcon });
  if (status !== "trash")
    actions.push({ action: "trash", label: "المهملات", icon: Trash2Icon });
  return actions;
}

export function getMessageActionRedirect(
  action: BulkMessageAction,
  direction: "inbound" | "outbound",
) {
  if (action === "trash") return "/trash";
  if (action === "spam") return "/spam";
  if (action === "archive") return "/archived";
  if (action === "inbox") return "/inbox";
  return null;
}

export function buildReplySubject(subject: string | null | undefined) {
  const trimmed = (subject ?? "").trim();
  if (!trimmed) return "Re:";
  return /^re:/i.test(trimmed) ? trimmed : `Re: ${trimmed}`;
}

export function buildReplyQuote(
  senderAddress: string,
  bodyText: string | null | undefined,
) {
  const latest = getLatestEmailContent(bodyText).trim();
  if (!latest) return "";
  const quoted = latest
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return `\n\nكتب ${getEmailAddress(senderAddress)}:\n${quoted}\n`;
}

export async function createReplyDraft({
  mailboxId,
  senderAddress,
  ownAddress,
  subject,
  bodyText,
}: ReplyDraftInput) {
  const to = getEmailAddress(senderAddress).trim();
  if (!to) throw new Error("عنوان المرسل مطلوب");

  const response = await authFetch("/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mailboxId,
      // The API rejects the draft unless `from` matches the mailbox address.
      from: getEmailAddress(ownAddress ?? ""),
      to,
      subject: buildReplySubject(subject),
      text: buildReplyQuote(senderAddress, bodyText),
    }),
  });
  const data = (await response.json()) as {
    draft?: { id: string };
    error?: string;
  };
  if (!response.ok || !data.draft)
    throw new Error(data.error ?? "تعذر إنشاء مسودة الرد");
  return data.draft.id;
}
