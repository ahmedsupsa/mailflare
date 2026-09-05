import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { crmAttachments } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import type { AttachmentRouteParams } from "../types";

export async function GET(request: Request, { params }: AttachmentRouteParams) {
	const env = getEnv();
	await requireUser(env, request);
	const { attachmentId } = await params;

	const [attachment] = await getDb(env)
		.select()
		.from(crmAttachments)
		.where(eq(crmAttachments.id, attachmentId))
		.limit(1);
	if (!attachment || attachment.kind !== "image" || !attachment.r2Key) {
		return new Response("Not found", { status: 404 });
	}

	const object = await env.BUCKET.get(attachment.r2Key);
	if (!object) return new Response("Not found", { status: 404 });

	const headers = new Headers();
	headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
	headers.set("X-Content-Type-Options", "nosniff");
	headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; sandbox");
	headers.set("Cache-Control", "private, max-age=3600");
	return new Response(object.body, { headers });
}
