import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { newId } from "@/lib/ids";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

async function hashToken(token: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

export async function createPasswordResetToken(env: CloudflareEnv, userId: string): Promise<string> {
	const db = getDb(env);
	const token = newId("prt");
	const tokenHash = await hashToken(token);
	const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

	await db.insert(passwordResetTokens).values({
		id: newId(),
		userId,
		tokenHash,
		expiresAt,
	});

	return token;
}

export async function consumePasswordResetToken(env: CloudflareEnv, token: string): Promise<string | null> {
	const db = getDb(env);
	const tokenHash = await hashToken(token);
	const [row] = await db
		.select()
		.from(passwordResetTokens)
		.where(
			and(
				eq(passwordResetTokens.tokenHash, tokenHash),
				gt(passwordResetTokens.expiresAt, new Date()),
				isNull(passwordResetTokens.usedAt),
			),
		)
		.limit(1);
	if (!row) return null;

	await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, row.id));
	return row.userId;
}
