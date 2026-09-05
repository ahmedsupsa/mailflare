export type AttachmentKind = "image" | "link";

export type AttachmentResponse = {
	id: string;
	leadId: string | null;
	taskId: string | null;
	kind: AttachmentKind;
	url: string;
	label: string;
	createdByUserId: string;
	createdByName: string;
	createdAt: string;
};

export type LinkAttachmentInput = {
	leadId?: string | null;
	taskId?: string | null;
	url: string;
	label?: string;
};

export type UploadedImageFile = File;
