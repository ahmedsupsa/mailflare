import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEventAttendees } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import type { CalendarEventRouteParams } from "../types";

export async function PATCH(request: Request, { params }: CalendarEventRouteParams) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const { eventId } = await params;
	const { status } = (await request.json()) as { status?: string };
	if (status !== "accepted" && status !== "declined") return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });

	const db = getDb(env);
	const [existing] = await db
		.select({ id: calendarEventAttendees.id })
		.from(calendarEventAttendees)
		.where(and(eq(calendarEventAttendees.eventId, eventId), eq(calendarEventAttendees.userId, user.id)))
		.limit(1);
	if (!existing) return NextResponse.json({ error: "لست مدعوًا لهذا الحدث" }, { status: 404 });

	await db.update(calendarEventAttendees).set({ status }).where(eq(calendarEventAttendees.id, existing.id));
	return NextResponse.json({ ok: true });
}
