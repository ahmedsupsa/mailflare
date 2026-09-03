import { and, asc, eq, gte, inArray, lt, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { calendarEventAttendees, calendarEvents, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import type { CalendarEventInput, CalendarEventResponse } from "./types";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const url = new URL(request.url);
	const start = new Date(url.searchParams.get("start") ?? Date.now());
	const end = new Date(url.searchParams.get("end") ?? start.getTime() + 31 * 86_400_000);
	const db = getDb(env);

	const eventRows = await db
		.selectDistinct({
			id: calendarEvents.id,
			userId: calendarEvents.userId,
			mailboxId: calendarEvents.mailboxId,
			title: calendarEvents.title,
			description: calendarEvents.description,
			location: calendarEvents.location,
			startsAt: calendarEvents.startsAt,
			endsAt: calendarEvents.endsAt,
		})
		.from(calendarEvents)
		.leftJoin(calendarEventAttendees, eq(calendarEventAttendees.eventId, calendarEvents.id))
		.where(
			and(
				or(eq(calendarEvents.userId, user.id), eq(calendarEventAttendees.userId, user.id)),
				gte(calendarEvents.startsAt, start),
				lt(calendarEvents.startsAt, end),
			),
		)
		.orderBy(asc(calendarEvents.startsAt));

	const eventIds = eventRows.map((event) => event.id);
	const attendeeRows = eventIds.length
		? await db
				.select({
					eventId: calendarEventAttendees.eventId,
					userId: calendarEventAttendees.userId,
					status: calendarEventAttendees.status,
					name: users.name,
					email: users.email,
				})
				.from(calendarEventAttendees)
				.innerJoin(users, eq(users.id, calendarEventAttendees.userId))
				.where(inArray(calendarEventAttendees.eventId, eventIds))
		: [];

	const organizerIds = [...new Set(eventRows.map((event) => event.userId))];
	const organizers = organizerIds.length
		? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, organizerIds))
		: [];
	const organizerNameById = new Map(organizers.map((organizer) => [organizer.id, organizer.name]));

	const events: CalendarEventResponse[] = eventRows.map((event) => {
		const attendees = attendeeRows
			.filter((row) => row.eventId === event.id)
			.map((row) => ({ userId: row.userId, name: row.name, email: row.email, status: row.status }));
		const isOrganizer = event.userId === user.id;
		const mine = attendees.find((attendee) => attendee.userId === user.id);
		return {
			...event,
			organizerName: organizerNameById.get(event.userId) ?? "",
			isOrganizer,
			attendees,
			myStatus: isOrganizer ? "organizer" : (mine?.status ?? "pending"),
		};
	});

	return NextResponse.json({ events });
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const input = (await request.json()) as CalendarEventInput;
	const startsAt = new Date(input.startsAt);
	const endsAt = new Date(input.endsAt);
	if (!input.title?.trim() || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)
		return NextResponse.json({ error: "أدخل عنوانًا وأوقاتًا صالحة للحدث" }, { status: 400 });

	const db = getDb(env);
	const attendeeIds = [...new Set((input.attendeeIds ?? []).filter((id) => id && id !== user.id))];
	if (attendeeIds.length) {
		const validUsers = await db.select({ id: users.id }).from(users).where(inArray(users.id, attendeeIds));
		if (validUsers.length !== attendeeIds.length) return NextResponse.json({ error: "أحد الأعضاء المختارين غير موجود" }, { status: 400 });
	}

	const event = {
		id: newId("evt"),
		userId: user.id,
		mailboxId: input.mailboxId ?? null,
		title: input.title.trim(),
		description: input.description?.trim() ?? "",
		location: input.location?.trim() ?? "",
		startsAt,
		endsAt,
	};
	await db.insert(calendarEvents).values(event);
	if (attendeeIds.length) {
		await db.insert(calendarEventAttendees).values(
			attendeeIds.map((userId) => ({ id: newId("att"), eventId: event.id, userId, status: "pending" as const })),
		);
	}
	return NextResponse.json({ event });
}
