import { NextResponse } from "next/server";

const accountsRemovedResponse = () =>
	NextResponse.json({ error: "الحسابات المتعددة غير متاحة في هذا الإصدار" }, { status: 410 });

export async function GET() {
	return accountsRemovedResponse();
}

export async function POST() {
	return accountsRemovedResponse();
}

export async function DELETE() {
	return accountsRemovedResponse();
}
