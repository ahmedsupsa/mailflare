import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { folders } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { getImportMessageUserId } from "@/lib/import/destination";
import { importMessagesToMailbox } from "@/lib/import/service";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import { parseImportForm } from "./utils";

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	let input: Awaited<ReturnType<typeof parseImportForm>>;
	try {
		input = await parseImportForm(request);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "ملف الاستيراد غير صالح" }, { status });
	}

	if (!input.mailboxId || input.messages.length === 0) {
		return NextResponse.json({ error: "اختر صندوق بريد وملف واحد على الأقل بصيغة .eml أو .mbox" }, { status: 400 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, input.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: "صندوق البريد غير موجود" }, { status: 404 });
	}
	if (input.destination.type === "folder") {
		const [folder] = await db
			.select({ id: folders.id })
			.from(folders)
			.where(and(eq(folders.id, input.destination.folderId), eq(folders.mailboxId, access.mailbox.id)))
			.limit(1);
		if (!folder) {
			return NextResponse.json({ error: "المجلد غير موجود" }, { status: 404 });
		}
	}

	const result = await importMessagesToMailbox(env, {
		userId: getImportMessageUserId(input.destination, user.id, access.mailbox.userId),
		mailboxId: access.mailbox.id,
		destination: input.destination,
		messages: input.messages,
	});
	return NextResponse.json(result);
}
