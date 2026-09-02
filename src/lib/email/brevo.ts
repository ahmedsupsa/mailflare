import { getEmailAddress, getEmailDisplayName } from "@/lib/email/address";
import type { AttachmentContent } from "@/lib/email/attachment-types";

type BrevoSendInput = {
	from: string;
	to: string;
	subject: string;
	html?: string;
	text?: string;
	headers?: Record<string, string>;
	attachments?: AttachmentContent[];
};

type BrevoSendResponse = {
	messageId?: string;
	messageIds?: string[];
};

const BREVO_SEND_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const BASE64_CHUNK_SIZE = 0x8000;

function arrayBufferToBase64(content: ArrayBuffer): string {
	const bytes = new Uint8Array(content);
	let binary = "";
	for (let index = 0; index < bytes.length; index += BASE64_CHUNK_SIZE) {
		binary += String.fromCharCode(...bytes.subarray(index, index + BASE64_CHUNK_SIZE));
	}
	return btoa(binary);
}

function getBrevoHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
	if (!headers) return undefined;

	const allowedHeaders: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		if (!key.toLowerCase().startsWith("x-")) continue;
		allowedHeaders[key] = value;
	}

	return Object.keys(allowedHeaders).length ? allowedHeaders : undefined;
}

export async function sendEmailWithBrevo(
	apiKey: string,
	input: BrevoSendInput,
): Promise<{ messageId: string }> {
	const brevoHeaders = getBrevoHeaders(input.headers);
	const body = {
		sender: {
			email: getEmailAddress(input.from),
			name: getEmailDisplayName(input.from),
		},
		to: [{ email: getEmailAddress(input.to), name: getEmailDisplayName(input.to) }],
		replyTo: {
			email: getEmailAddress(input.from),
			name: getEmailDisplayName(input.from),
		},
		subject: input.subject || "(بدون موضوع)",
		...(input.html ? { htmlContent: input.html } : { textContent: input.text || " " }),
		...(brevoHeaders ? { headers: brevoHeaders } : {}),
		...(input.attachments?.length
			? {
					attachment: input.attachments.map((attachment) => ({
						name: attachment.filename,
						content: arrayBufferToBase64(attachment.content),
					})),
				}
			: {}),
	};

	const response = await fetch(BREVO_SEND_ENDPOINT, {
		method: "POST",
		headers: {
			accept: "application/json",
			"api-key": apiKey,
			"content-type": "application/json",
		},
		body: JSON.stringify(body),
	});
	const data = (await response.json().catch(() => ({}))) as BrevoSendResponse & {
		code?: string;
		message?: string;
	};

	if (!response.ok) {
		throw new Error(data.message ? `Brevo API ${response.status}: ${data.message}` : `Brevo API ${response.status}`);
	}

	return { messageId: data.messageId ?? data.messageIds?.[0] ?? "" };
}
