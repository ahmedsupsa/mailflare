import { desc, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads, users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { newId } from "@/lib/ids";
import type { LeadInput, LeadStatus } from "./types";

const STATUSES: LeadStatus[] = ["new", "contacted", "interested", "won", "lost"];

export async function GET(request: Request) {
	const env = getEnv();
	await requireUser(env, request);
	const db = getDb(env);

	const rows = await db.select().from(leads).orderBy(desc(leads.createdAt));
	const creatorIds = [...new Set(rows.map((row) => row.createdByUserId))];
	const creators = creatorIds.length
		? await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, creatorIds))
		: [];
	const nameById = new Map(creators.map((creator) => [creator.id, creator.name]));

	const items = rows.map((row) => ({
		...row,
		createdByName: nameById.get(row.createdByUserId) ?? "",
	}));
	return NextResponse.json({ leads: items });
}

export async function POST(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const input = (await request.json()) as LeadInput;
	if (!input.contactName?.trim()) {
		return NextResponse.json({ error: "اسم جهة الاتصال مطلوب" }, { status: 400 });
	}
	const status = input.status && STATUSES.includes(input.status) ? input.status : "new";

	const lead = {
		id: newId("lead"),
		businessName: input.businessName?.trim() ?? "",
		contactName: input.contactName.trim(),
		phone: input.phone?.trim() ?? "",
		email: input.email?.trim() ?? "",
		status,
		notes: input.notes?.trim() ?? "",
		createdByUserId: user.id,
	};
	await getDb(env).insert(leads).values(lead);
	return NextResponse.json({ lead: { ...lead, createdByName: user.name } });
}
