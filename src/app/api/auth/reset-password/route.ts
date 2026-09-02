import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { resetPasswordSchema } from "@/lib/validators";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { consumePasswordResetToken } from "@/lib/auth/password-reset";
import { hashPassword } from "@/lib/auth/password";
import { recordAuthActivity } from "@/lib/auth/activity";

export async function POST(request: Request) {
	const env = getEnv();
	let body: unknown;
	try {
		body = await readJsonBody(request, 4 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "طلب غير صالح" }, { status });
	}
	const parsed = resetPasswordSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
	}

	const userId = await consumePasswordResetToken(env, parsed.data.token);
	if (!userId) {
		return NextResponse.json({ error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية" }, { status: 400 });
	}

	const db = getDb(env);
	await db.update(users).set({ passwordHash: hashPassword(parsed.data.password) }).where(eq(users.id, userId));
	await db.delete(sessions).where(eq(sessions.userId, userId));
	await recordAuthActivity(env, { action: "auth.password_reset", userId, request });

	return NextResponse.json({ ok: true });
}
