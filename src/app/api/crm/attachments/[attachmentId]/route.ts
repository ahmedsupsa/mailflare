import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { crmAttachments } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import type { AttachmentRouteParams } from "./types";

export async function DELETE(request: Request, { params }: AttachmentRouteParams) {
	const env = getEnv();
	await requireUser(env, request);
	const { attachmentId } = await params;

	const db = getDb(env);
	const [existing] = await db.select().from(crmAttachments).where(eq(crmAttachments.id, attachmentId)).limit(1);
	if (!existing) return NextResponse.json({ error: "المرفق غير موجود" }, { status: 404 });

	if (existing.r2Key) await env.BUCKET.delete(existing.r2Key);
	await db.delete(crmAttachments).where(eq(crmAttachments.id, attachmentId));
	return NextResponse.json({ ok: true });
}
