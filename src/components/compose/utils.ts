import { authFetch } from "@/lib/auth/client";
import type { ComposeAttachment, ComposeDraft, DraftResponse } from "./types";

export async function fetchDraft(draftId: string): Promise<ComposeDraft> {
	const res = await authFetch(`/api/drafts/${draftId}`);
	const json = (await res.json()) as DraftResponse;

	if (!res.ok || !json.draft) {
		throw new Error(json.error ?? "فشل تحميل المسودة");
	}

	return json.draft;
}

export function buildSendFormData(input: {
	attachments: ComposeAttachment[];
	from: string;
	mailboxId?: string;
	subject: string;
	text: string;
	html: string;
	to: string;
}): FormData {
	const form = new FormData();
	form.set("from", input.from);
	form.set("to", input.to);
	form.set("subject", input.subject);
	form.set("text", input.text);
	if (input.html.trim()) form.set("html", input.html);
	if (input.mailboxId) form.set("mailboxId", input.mailboxId);
	for (const attachment of input.attachments) {
		form.append("attachments", attachment.file);
	}
	return form;
}

export function formatAttachmentSize(size: number): string {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const SIGNATURE_ATTR = 'data-mershhah-signature="true"';
const SIGNATURE_BLOCK_RE = /<div[^>]*data-mershhah-signature="true"[^>]*>[\s\S]*?<\/div>/;

function escapeHtml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Converts a plain-text body (e.g. a reply quote) into a simple HTML fragment for the rich editor. */
export function textToHtml(text: string): string {
	if (!text.trim()) return "";
	return `<p>${escapeHtml(text).split("\n").join("<br>")}</p>`;
}

/** Best-effort plain-text rendering of the editor's HTML, used as the multipart text fallback. */
export function htmlToPlainText(html: string): string {
	if (typeof document === "undefined") return html.replace(/<[^>]+>/g, "").trim();
	const container = document.createElement("div");
	container.innerHTML = html;
	container.querySelectorAll("br").forEach((br) => br.replaceWith("\n"));
	container.querySelectorAll("p, div, li, blockquote, h1, h2, h3, h4").forEach((el) => {
		el.append("\n");
	});
	return (container.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim();
}

export function stripSignatureFromHtml(html: string): string {
	return html.replace(SIGNATURE_BLOCK_RE, "").trim();
}

export function applyMailboxSignatureHtml(html: string, nextSignature: string | null | undefined): string {
	const stripped = stripSignatureFromHtml(html);
	const value = (nextSignature ?? "").trim();
	if (!value) return stripped;
	const block = `<div ${SIGNATURE_ATTR}>${escapeHtml(value).split("\n").join("<br>")}</div>`;
	return stripped ? `${stripped}${block}` : block;
}
