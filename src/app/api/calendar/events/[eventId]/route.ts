import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEventAttendees, calendarEvents, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import type { CalendarEventInput } from "../types";
import type { CalendarEventRouteParams } from "./types";

export async function PATCH(request: Request, { params }: CalendarEventRouteParams) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const { eventId } = await params;
	const input = (await request.json()) as CalendarEventInput;
	const startsAt = new Date(input.startsAt);
	const endsAt = new Date(input.endsAt);
	if (!input.title?.trim() || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)
		return NextResponse.json({ error: "أدخل عنوانًا وأوقاتًا صالحة للحدث" }, { status: 400 });

	const db = getDb(env);
	const [existing] = await db.select().from(calendarEvents).where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, user.id))).limit(1);
	if (!existing) return NextResponse.json({ error: "الحدث غير موجود" }, { status: 404 });

	const attendeeIds = [...new Set((input.attendeeIds ?? []).filter((id) => id && id !== user.id))];
	if (attendeeIds.length) {
		const validUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, attendeeIds));
		if (validUsers.length !== attendeeIds.length) return NextResponse.json({ error: "أحد الأعضاء المختارين غير موجود" }, { status: 400 });
	}

	await db
		.update(calendarEvents)
		.set({
			title: input.title.trim(),
			description: input.description?.trim() ?? "",
			location: input.location?.trim() ?? "",
			startsAt,
			endsAt,
			updatedAt: new Date(),
		})
		.where(eq(calendarEvents.id, eventId));

	await db.delete(calendarEventAttendees).where(eq(calendarEventAttendees.eventId, eventId));
	if (attendeeIds.length) {
		await db.insert(calendarEventAttendees).values(
			attendeeIds.map((userId) => ({ id: newId("att"), eventId, userId, status: "pending" as const })),
		);
	}
	return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: CalendarEventRouteParams) {
	const env = getEnv();
	const user = await requireUser(env, _request);
	const { eventId } = await params;
	await getDb(env).delete(calendarEvents).where(and(eq(calendarEvents.id, eventId), eq(calendarEvents.userId, user.id)));
	return NextResponse.json({ ok: true });
}
