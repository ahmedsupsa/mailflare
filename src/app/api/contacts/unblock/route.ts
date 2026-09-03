import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { unblockContact } from "@/lib/contacts/service";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import type { BlockContactRequest } from "../block/types";

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const body = (await request.json()) as BlockContactRequest;
	if (!body.mailboxId || !body.address?.trim()) {
		return NextResponse.json({ error: "صندوق البريد وجهة الاتصال مطلوبان" }, { status: 400 });
	}

	const access = await getMailboxAccessLevel(getDb(env), user, body.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: "صندوق البريد غير موجود" }, { status: 404 });
	}

	const contact = await unblockContact(env, {
		userId: access.mailbox.userId,
		mailboxId: access.mailbox.id,
		domainId: access.mailbox.domainId,
		address: body.address,
	});
	return NextResponse.json({ contact });
}
