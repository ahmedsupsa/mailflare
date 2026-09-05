import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { crmAttachments, leads, tasks, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import type { LinkAttachmentInput } from "./types";
import { isValidHttpUrl, newAttachmentId } from "./utils";

export async function GET(request: Request) {
	const env = getEnv();
	await requireUser(env, request);
	const url = new URL(request.url);
	const leadId = url.searchParams.get("leadId");
	const taskId = url.searchParams.get("taskId");
	if (!leadId && !taskId) {
		return NextResponse.json({ error: "leadId أو taskId مطلوب" }, { status: 400 });
	}

	const db = getDb(env);
	const rows = await db
		.select()
		.from(crmAttachments)
		.where(leadId ? eq(crmAttachments.leadId, leadId) : eq(crmAttachments.taskId, taskId!))
		.orderBy(desc(crmAttachments.createdAt));

	const creatorIds = [...new Set(rows.map((row) => row.createdByUserId))];
	const creators = creatorIds.length
		? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, creatorIds))
		: [];
	const nameById = new Map(creators.map((creator) => [creator.id, creator.name]));

	const items = rows.map((row) => ({
		...row,
		url: row.kind === "image" ? `/api/crm/attachments/${row.id}/file` : row.url,
		createdByName: nameById.get(row.createdByUserId) ?? "",
	}));
	return NextResponse.json({ attachments: items });
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const input = (await request.json()) as LinkAttachmentInput;
	if (!input.leadId && !input.taskId) {
		return NextResponse.json({ error: "leadId أو taskId مطلوب" }, { status: 400 });
	}
	if (!input.url?.trim() || !isValidHttpUrl(input.url.trim())) {
		return NextResponse.json({ error: "رابط غير صالح" }, { status: 400 });
	}

	const db = getDb(env);
	if (input.leadId) {
		const [lead] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, input.leadId)).limit(1);
		if (!lead) return NextResponse.json({ error: "العميل المحتمل غير موجود" }, { status: 404 });
	}
	if (input.taskId) {
		const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, input.taskId)).limit(1);
		if (!task) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
	}

	const attachment = {
		id: newAttachmentId(),
		leadId: input.leadId ?? null,
		taskId: input.taskId ?? null,
		kind: "link" as const,
		url: input.url.trim(),
		label: input.label?.trim() ?? "",
		createdByUserId: user.id,
	};
	await db.insert(crmAttachments).values(attachment);
	return NextResponse.json({ attachment: { ...attachment, createdByName: user.name } });
}
