import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { crmAttachments, leads, tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import {
	ALLOWED_ATTACHMENT_IMAGE_TYPES,
	MAX_ATTACHMENT_IMAGE_SIZE,
	attachmentImageKeyFor,
	isUploadedImageFile,
	newAttachmentId,
} from "../utils";

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return NextResponse.json({ error: "يجب إرسال البيانات بصيغة multipart form data" }, { status: 400 });
	}

	const leadId = form.get("leadId");
	const taskId = form.get("taskId");
	const leadIdStr = typeof leadId === "string" && leadId ? leadId : null;
	const taskIdStr = typeof taskId === "string" && taskId ? taskId : null;
	if (!leadIdStr && !taskIdStr) {
		return NextResponse.json({ error: "leadId أو taskId مطلوب" }, { status: 400 });
	}

	const file = form.get("file");
	if (!isUploadedImageFile(file)) {
		return NextResponse.json({ error: "ملف الصورة مفقود" }, { status: 400 });
	}
	if (!ALLOWED_ATTACHMENT_IMAGE_TYPES.includes(file.type)) {
		return NextResponse.json({ error: "استخدم صورة بصيغة JPEG أو PNG أو WebP أو GIF" }, { status: 400 });
	}
	if (file.size > MAX_ATTACHMENT_IMAGE_SIZE) {
		return NextResponse.json({ error: "يجب ألا يتجاوز حجم الصورة 5 ميجابايت" }, { status: 413 });
	}

	const db = getDb(env);
	if (leadIdStr) {
		const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadIdStr)).limit(1);
		if (!lead) return NextResponse.json({ error: "العميل المحتمل غير موجود" }, { status: 404 });
	}
	if (taskIdStr) {
		const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskIdStr)).limit(1);
		if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
	}

	const id = newAttachmentId();
	const key = attachmentImageKeyFor(id);
	await env.BUCKET.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

	const attachment = {
		id,
		leadId: leadIdStr,
		taskId: taskIdStr,
		kind: "image" as const,
		url: key,
		r2Key: key,
		label: typeof file.name === "string" ? file.name : "",
		createdByUserId: user.id,
	};
	await db.insert(crmAttachments).values(attachment);
	return NextResponse.json({
		attachment: { ...attachment, url: `/api/crm/attachments/${id}/file`, createdByName: user.name },
	});
}
