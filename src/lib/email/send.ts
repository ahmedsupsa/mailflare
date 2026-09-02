import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { messages, outboundJobs } from "@/db/schema";
import { newId } from "@/lib/ids";
import { buildSnippet } from "@/lib/email/parse";
import { dispatchWebhooks } from "@/lib/email/webhooks";
import { upsertContactFromAddress } from "@/lib/contacts/service";
import { getAuthorizedSenderAddress } from "@/lib/email/sender";
import { createAuditLog } from "@/lib/mailboxes/audit";
import { storeMessageAttachments, validateAttachments } from "@/lib/email/attachments";
import { sendEmailWithBrevo } from "@/lib/email/brevo";
import { getBranding } from "@/lib/branding/service";
import type { Branding } from "@/lib/branding/types";
import type { AttachmentContent } from "@/lib/email/attachment-types";

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

type SocialLinks = Pick<Branding, "websiteUrl" | "instagramUrl" | "tiktokUrl">;

function buildSocialBadgesHtml(branding: SocialLinks): string {
	const links: Array<{ href: string; label: string }> = [];
	if (branding.websiteUrl) links.push({ href: branding.websiteUrl, label: "الموقع" });
	if (branding.instagramUrl) links.push({ href: branding.instagramUrl, label: "إنستغرام" });
	if (branding.tiktokUrl) links.push({ href: branding.tiktokUrl, label: "تيك توك" });
	if (!links.length) return "";

	const cells = links
		.map(
			(link) =>
				`<td style="padding:0 4px;">` +
				`<a href="${escapeHtml(link.href)}" style="display:inline-block;padding:6px 14px;border-radius:999px;background-color:#171717;color:#ffffff;font-size:11px;font-family:Arial,Helvetica,sans-serif;text-decoration:none;">${escapeHtml(link.label)}</a>` +
				`</td>`,
		)
		.join("");

	return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>${cells}</tr></table>`;
}

function appendHtmlFooter(html: string | undefined, branding: Branding): string | undefined {
	const footerText = branding.emailFooter.trim();
	const badges = buildSocialBadgesHtml(branding);
	if (!footerText && !badges) return html;

	const textLine = footerText
		? `<p style="margin:0 0 ${badges ? "10px" : "0"} 0;">${escapeHtml(footerText).split("\n").join("<br>")}</p>`
		: "";
	const block = `<div dir="auto" style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e5e5;color:#8a8a8a;font-size:12px;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">${textLine}${badges}</div>`;
	return html ? `${html}${block}` : block;
}

function appendTextFooter(text: string | undefined, branding: Branding): string | undefined {
	const footerText = branding.emailFooter.trim();
	const links = [branding.websiteUrl, branding.instagramUrl, branding.tiktokUrl].filter(Boolean);
	const block = [footerText, links.join(" | ")].filter(Boolean).join("\n");
	if (!block) return text;
	return text ? `${text}\n\n---\n${block}` : block;
}

export type SendEmailInput = {
	userId: string;
	from: string;
	to: string;
	subject: string;
	html?: string;
	text?: string;
	headers?: Record<string, string>;
	mailboxId: string;
	attachments?: AttachmentContent[];
};

export async function sendEmail(env: CloudflareEnv, input: SendEmailInput): Promise<{ messageId: string }> {
	const db = getDb(env);
	const sender = await getAuthorizedSenderAddress(env, input);
	const attachments = input.attachments ?? [];
	validateAttachments(attachments);
	await upsertContactFromAddress(env, {
		userId: input.userId,
		address: input.to,
		source: "outbound",
	});
	const messageId = newId("msg");
	const branding = await getBranding(env);
	const footeredText = appendTextFooter(input.text, branding);
	const footeredHtml = appendHtmlFooter(input.html, branding);
	const snippet = buildSnippet(footeredText ?? null, footeredHtml ?? null);

	await db.insert(messages).values({
		id: messageId,
		userId: input.userId,
		mailboxId: sender.mailboxId,
		direction: "outbound",
		fromAddr: sender.fromAddr,
		toAddr: input.to,
		subject: input.subject,
		snippet,
		textBody: footeredText ?? null,
		htmlBody: footeredHtml ?? null,
		status: "queued",
	});
	try {
		await storeMessageAttachments(env, messageId, attachments);
	} catch (error) {
		await db.delete(messages).where(eq(messages.id, messageId));
		throw error;
	}

	const jobId = newId("job");
	await db.insert(outboundJobs).values({
		id: jobId,
		userId: input.userId,
		messageId,
		status: "queued",
		payload: JSON.stringify({
			...input,
			from: sender.fromAddr,
			mailboxId: sender.mailboxId,
			attachments: attachments.map(({ content: _content, ...attachment }) => attachment),
		}),
	});

	try {
		const response = env.BREVO_API_KEY
			? await sendEmailWithBrevo(env.BREVO_API_KEY, {
					from: sender.fromAddr,
					to: input.to,
					subject: input.subject,
					headers: input.headers,
					html: footeredHtml,
					text: footeredText,
					attachments,
				})
			: await env.EMAIL.send({
					from: sender.fromAddr,
					to: input.to,
					subject: input.subject,
					headers: input.headers,
					html: footeredHtml,
					text: footeredText,
					attachments: attachments.map((attachment) =>
						attachment.disposition === "inline" && attachment.contentId
							? {
									filename: attachment.filename,
									type: attachment.type,
									content: attachment.content,
									disposition: "inline" as const,
									contentId: attachment.contentId,
								}
							: {
									filename: attachment.filename,
									type: attachment.type,
									content: attachment.content,
									disposition: "attachment" as const,
								},
					),
				});

		await db
			.update(messages)
			.set({ status: "sent", providerMessageId: response.messageId })
			.where(eq(messages.id, messageId));
		await db.update(outboundJobs).set({ status: "sent", updatedAt: new Date() }).where(eq(outboundJobs.id, jobId));

		await dispatchWebhooks(env, input.userId, "message.outbound", {
			messageId,
			providerMessageId: response.messageId,
			to: input.to,
		});
		await createAuditLog(env, {
			actorUserId: input.userId,
			mailboxId: sender.mailboxId,
			messageId,
			action: "email.send",
			metadata: { to: input.to, subject: input.subject },
		});

		return { messageId };
	} catch (err) {
		const error = err instanceof Error ? err.message : "فشل الإرسال";
		await db.update(messages).set({ status: "failed" }).where(eq(messages.id, messageId));
		await db
			.update(outboundJobs)
			.set({ status: "failed", error, updatedAt: new Date() })
			.where(eq(outboundJobs.id, jobId));
		await dispatchWebhooks(env, input.userId, "message.failed", { messageId, error });
		throw err;
	}
}

export type OutboundQueueMessage = SendEmailInput & { jobId?: string };

export async function processOutboundQueue(
	env: CloudflareEnv,
	payload: OutboundQueueMessage,
): Promise<void> {
	await sendEmail(env, payload);
}
