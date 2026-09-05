import { asc, desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads, tasks, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import type { TaskInput, TaskStatus } from "./types";

const STATUSES: TaskStatus[] = ["pending", "done"];

export async function GET(request: Request) {
	const env = getEnv();
	await requireUser(env, request);
	const db = getDb(env);

	const rows = await db.select().from(tasks).orderBy(desc(tasks.status), asc(tasks.dueAt));
	const userIds = [...new Set([...rows.map((row) => row.createdByUserId), ...rows.map((row) => row.assigneeUserId).filter((id): id is string => !!id)])];
	const leadIds = [...new Set(rows.map((row) => row.leadId).filter((id): id is string => !!id))];

	const usersById = userIds.length
		? new Map((await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds))).map((u) => [u.id, u.name]))
		: new Map<string, string>();
	const leadsById = leadIds.length
		? new Map((await db.select({ id: leads.id, contactName: leads.contactName, businessName: leads.businessName }).from(leads).where(inArray(leads.id, leadIds))).map((l) => [l.id, l.businessName || l.contactName]))
		: new Map<string, string>();

	const items = rows.map((row) => ({
		...row,
		assigneeName: row.assigneeUserId ? (usersById.get(row.assigneeUserId) ?? null) : null,
		leadName: row.leadId ? (leadsById.get(row.leadId) ?? null) : null,
		createdByName: usersById.get(row.createdByUserId) ?? "",
	}));
	return NextResponse.json({ tasks: items });
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const input = (await request.json()) as TaskInput;
	if (!input.title?.trim()) {
		return NextResponse.json({ error: "عنوان المهمة مطلوب" }, { status: 400 });
	}
	const status = input.status && STATUSES.includes(input.status) ? input.status : "pending";
	const dueAt = input.dueAt ? new Date(input.dueAt) : null;
	if (dueAt && Number.isNaN(dueAt.getTime())) {
		return NextResponse.json({ error: "تاريخ استحقاق غير صالح" }, { status: 400 });
	}

	const db = getDb(env);
	if (input.assigneeUserId) {
		const [assignee] = await db.select({ id: users.id }).from(users).where(inArray(users.id, [input.assigneeUserId])).limit(1);
		if (!assignee) return NextResponse.json({ error: "العضو المحدد غير موجود" }, { status: 400 });
	}
	if (input.leadId) {
		const [lead] = await db.select({ id: leads.id }).from(leads).where(inArray(leads.id, [input.leadId])).limit(1);
		if (!lead) return NextResponse.json({ error: "العميل المحتمل المحدد غير موجود" }, { status: 400 });
	}

	const task = {
		id: newId("task"),
		title: input.title.trim(),
		description: input.description?.trim() ?? "",
		dueAt,
		status,
		assigneeUserId: input.assigneeUserId || null,
		leadId: input.leadId || null,
		createdByUserId: user.id,
	};
	await db.insert(tasks).values(task);
	return NextResponse.json({ task });
}
