import { newId } from "@/lib/ids";
import type { UploadedImageFile } from "./types";

export const MAX_ATTACHMENT_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function attachmentImageKeyFor(attachmentId: string): string {
	return `crm-attachments/${attachmentId}`;
}

export function isUploadedImageFile(value: FormDataEntryValue | null): value is UploadedImageFile {
	return (
		value !== null &&
		typeof value !== "string" &&
		typeof value.arrayBuffer === "function" &&
		typeof value.size === "number" &&
		typeof value.type === "string"
	);
}

export function isValidHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export function newAttachmentId(): string {
	return newId("att");
}
