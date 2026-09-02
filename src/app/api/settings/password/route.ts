import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { getEnv } from "@/lib/cloudflare";
import type { ChangePasswordInput } from "./types";
import { parseChangePasswordRequest } from "./utils";

export async function PATCH(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	let parsed: ChangePasswordInput;

	try {
		parsed = await parseChangePasswordRequest(request);
	} catch (err) {
		if (err instanceof ZodError) {
			return NextResponse.json({ error: err.flatten() }, { status: 400 });
		}
		return NextResponse.json({ error: "الطلب غير صالح" }, { status: 400 });
	}

	if (!verifyPassword(parsed.currentPassword, user.passwordHash)) {
		return NextResponse.json({ error: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
	}

	if (verifyPassword(parsed.newPassword, user.passwordHash)) {
		return NextResponse.json({ error: "يجب أن تكون كلمة المرور الجديدة مختلفة عن كلمة المرور الحالية" }, { status: 400 });
	}

	const db = getDb(env);
	await db
		.update(users)
		.set({ passwordHash: hashPassword(parsed.newPassword) })
		.where(eq(users.id, user.id));

	return NextResponse.json({ ok: true });
}
