import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";

export async function GET(request: Request) {
	const env = getEnv();
	const user = await requireUser(env, request);
	const members = await getDb(env)
		.select({ id: users.id, name: users.name, email: users.email })
		.from(users)
		.where(eq(users.disabled, false))
		.orderBy(asc(users.name));
	return NextResponse.json({ members: members.filter((member) => member.id !== user.id) });
}
