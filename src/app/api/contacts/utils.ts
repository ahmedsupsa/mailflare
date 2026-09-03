import { and, desc, eq, like, or } from "drizzle-orm";
import type { getDb } from "@/db";
import { contacts } from "@/db/schema";
import { getContactId } from "@/lib/contacts/utils";

type Db = ReturnType<typeof getDb>;

export async function listContactsForUser(db: Db, userId: string, search?: string) {
	const term = search?.trim();
	return db
		.select()
		.from(contacts)
		.where(
			and(
				eq(contacts.userId, userId),
				term ? or(like(contacts.email, `%${term}%`), like(contacts.displayName, `%${term}%`)) : undefined,
			),
		)
		.orderBy(desc(contacts.lastSeenAt), desc(contacts.createdAt));
}

export async function getContactByEmail(db: Db, userId: string, email: string) {
	const [contact] = await db
		.select()
		.from(contacts)
		.where(and(eq(contacts.userId, userId), eq(contacts.email, email)))
		.limit(1);
	return contact ?? null;
}

export async function saveManualContactName(
	db: Db,
	input: { userId: string; email: string; displayName: string },
) {
	const existing = await getContactByEmail(db, input.userId, input.email);
	if (existing) {
		await db
			.update(contacts)
			.set({ displayName: input.displayName, source: "manual" })
			.where(eq(contacts.id, existing.id));
		return { ...existing, displayName: input.displayName, source: "manual" as const };
	}

	const id = getContactId(input.userId, input.email);
	await db.insert(contacts).values({
		id,
		userId: input.userId,
		email: input.email,
		displayName: input.displayName,
		source: "manual",
	});
	return getContactByEmail(db, input.userId, input.email);
}
