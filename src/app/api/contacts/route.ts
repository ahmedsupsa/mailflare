import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { normalizeEmailAddress } from "@/lib/email/address";
import { getMailboxAccessLevel } from "@/lib/mailboxes/access";
import type { ContactRequestInput } from "./types";
import { getContactByEmail, listContactsForUser, saveManualContactName } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const mailboxId = url.searchParams.get("mailboxId");
	const rawAddress = url.searchParams.get("address");
	if (!mailboxId) {
		return NextResponse.json({ error: "صندوق البريد مطلوب" }, { status: 400 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, mailboxId);
	if (!access?.canRead) {
		return NextResponse.json({ error: "صندوق البريد غير موجود" }, { status: 404 });
	}

	if (rawAddress === null) {
		const contacts = await listContactsForUser(db, access.mailbox.userId, url.searchParams.get("q") ?? undefined);
		return NextResponse.json({ contacts });
	}

	const email = normalizeEmailAddress(rawAddress);
	if (!email) {
		return NextResponse.json({ error: "جهة الاتصال مطلوبة" }, { status: 400 });
	}
	const contact = await getContactByEmail(db, access.mailbox.userId, email);
	return NextResponse.json({
		contact: contact ?? {
			email,
			displayName: null,
			source: null,
			blocked: false,
			lastSeenAt: null,
		},
	});
}

export async function PATCH(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const body = (await request.json()) as ContactRequestInput;
	const email = normalizeEmailAddress(body.address ?? "");
	const displayName = body.displayName?.trim() ?? "";
	if (!body.mailboxId || !email || !displayName || displayName.length > 100) {
		return NextResponse.json({ error: "اسم جهة اتصال صالح مطلوب" }, { status: 400 });
	}

	const db = getDb(env);
	const access = await getMailboxAccessLevel(db, user, body.mailboxId);
	if (!access?.canManage) {
		return NextResponse.json({ error: "صندوق البريد غير موجود" }, { status: 404 });
	}
	const contact = await saveManualContactName(db, {
		userId: access.mailbox.userId,
		email,
		displayName,
	});
	return NextResponse.json({ contact });
}
