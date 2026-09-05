import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { requireUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import type { LeadInput, LeadStatus } from "../types";
import type { LeadRouteParams } from "./types";

const STATUSES: LeadStatus[] = ["new", "contacted", "interested", "won", "lost"];

export async function PATCH(request: Request, { params }: LeadRouteParams) {
	const env = getEnv();
	await requireUser(env, request);
	const { leadId } = await params;
	const input = (await request.json()) as LeadInput;
	if (!input.contactName?.trim()) {
		return NextResponse.json({ error: "اسم جهة الاتصال مطلوب" }, { status: 400 });
	}
	const status = input.status && STATUSES.includes(input.status) ? input.status : "new";

	const db = getDb(env);
	const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
	if (!existing) return NextResponse.json({ error: "العميل المحتمل غير موجود" }, { status: 404 });

	await db
		.update(leads)
		.set({
			businessName: input.businessName?.trim() ?? "",
			contactName: input.contactName.trim(),
			phone: input.phone?.trim() ?? "",
			email: input.email?.trim() ?? "",
			status,
			notes: input.notes?.trim() ?? "",
			updatedAt: new Date(),
		})
		.where(eq(leads.id, leadId));
	return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: LeadRouteParams) {
	const env = getEnv();
	await requireUser(env, request);
	const { leadId } = await params;
	await getDb(env).delete(leads).where(eq(leads.id, leadId));
	return NextResponse.json({ ok: true });
}
