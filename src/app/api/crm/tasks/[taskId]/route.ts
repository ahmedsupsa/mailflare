import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads, tasks, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import type { TaskInput, TaskStatus } from "../types";
import type { TaskRouteParams } from "./types";

const STATUSES: TaskStatus[] = ["pending", "done"];

export async function PATCH(request: Request, { params }: TaskRouteParams) {
	const env = getEnv();
	await requireUser(env, request);
	const { taskId } = await params;
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
	const [existing] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, taskId)).limit(1);
	if (!existing) return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });

	if (input.assigneeUserId) {
		const [assignee] = await db.select({ id: users.id }).from(users).where(inArray(users.id, [input.assigneeUserId])).limit(1);
		if (!assignee) return NextResponse.json({ error: "العضو المحدد غير موجود" }, { status: 400 });
	}
	if (input.leadId) {
		const [lead] = await db.select({ id: leads.id }).from(leads).where(inArray(leads.id, [input.leadId])).limit(1);
		if (!lead) return NextResponse.json({ error: "العميل المحتمل المحدد غير موجود" }, { status: 400 });
	}

	await db
		.update(tasks)
		.set({
			title: input.title.trim(),
			description: input.description?.trim() ?? "",
			dueAt,
			status,
			assigneeUserId: input.assigneeUserId || null,
			leadId: input.leadId || null,
			updatedAt: new Date(),
		})
		.where(eq(tasks.id, taskId));
	return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: TaskRouteParams) {
	const env = getEnv();
	await requireUser(env, request);
	const { taskId } = await params;
	await getDb(env).delete(tasks).where(eq(tasks.id, taskId));
	return NextResponse.json({ ok: true });
}
