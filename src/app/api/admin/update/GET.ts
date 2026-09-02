import { NextResponse } from "next/server";
import { authorizeAdminRequest, getUpdateStatus } from "./utils";

export async function GET(request: Request) {
	const authorization = await authorizeAdminRequest(request);
	if ("error" in authorization) return authorization.error;

	try {
		return NextResponse.json(await getUpdateStatus(authorization.env));
	} catch (error) {
		const message = error instanceof Error ? error.message : "تعذر التحقق من وجود تحديثات";
		const status = message.includes("يجب ضبط") ? 503 : 502;
		return NextResponse.json({ error: message }, { status });
	}
}