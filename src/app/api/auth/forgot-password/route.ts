import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getEnv } from "@/lib/cloudflare";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { forgotPasswordSchema } from "@/lib/validators";
import { allowLoginAttempt } from "@/lib/auth/rate-limit";
import { readJsonBody } from "@/lib/http/request";
import { RequestBodyTooLargeError } from "@/lib/http/errors";
import { createPasswordResetToken } from "@/lib/auth/password-reset";
import { getPrimaryDomain } from "@/lib/user";
import { formatEmailAddress } from "@/lib/email/address";
import { getBranding } from "@/lib/branding/service";

const GENERIC_MESSAGE = "إذا كان هذا البريد الإلكتروني مسجّلاً لدينا، أرسلنا رابط إعادة تعيين كلمة المرور إلى بريدك البديل.";

export async function POST(request: Request) {
	const env = getEnv();
	let body: unknown;
	try {
		body = await readJsonBody(request, 4 * 1024);
	} catch (error) {
		const status = error instanceof RequestBodyTooLargeError ? 413 : 400;
		return NextResponse.json({ error: "طلب غير صالح" }, { status });
	}
	const parsed = forgotPasswordSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json({ error: "بريد إلكتروني غير صالح" }, { status: 400 });
	}
	if (!(await allowLoginAttempt(env, request))) {
		return NextResponse.json(
			{ error: "عدد المحاولات كبير جدًا. حاول مرة أخرى بعد قليل." },
			{ status: 429, headers: { "Retry-After": "60" } },
		);
	}

	const db = getDb(env);
	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, parsed.data.email.toLowerCase().trim()))
		.limit(1);

	if (user && !user.disabled) {
		try {
			await sendResetEmail(env, user, new URL(request.url).origin);
		} catch (error) {
			console.error("Failed to send password reset email", error);
		}
	}

	return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}

async function sendResetEmail(
	env: CloudflareEnv,
	user: { id: string; email: string; resetEmail: string | null },
	origin: string,
): Promise<void> {
	const destination = user.resetEmail || user.email;
	const token = await createPasswordResetToken(env, user.id);
	const [domain, branding] = await Promise.all([getPrimaryDomain(env), getBranding(env)]);
	const link = `${origin}/reset-password?token=${token}`;
	const fromAddress = domain ? `noreply@${domain.hostname}` : "noreply@example.com";

	await env.EMAIL.send({
		from: formatEmailAddress(fromAddress, branding.appName),
		to: destination,
		subject: "إعادة تعيين كلمة المرور",
		text: `مرحبًا،\n\nطلب أحدهم (نأمل أنه أنت) إعادة تعيين كلمة مرور حسابك على ${branding.appName}.\n\nلإعادة التعيين، افتح هذا الرابط خلال ساعة واحدة:\n${link}\n\nإذا لم تطلب هذا، تجاهل هذه الرسالة ولن يتغيّر شيء.`,
		html: `<p>مرحبًا،</p><p>طلب أحدهم (نأمل أنه أنت) إعادة تعيين كلمة مرور حسابك على ${branding.appName}.</p><p>لإعادة التعيين، اضغط على الرابط التالي خلال ساعة واحدة:</p><p><a href="${link}">إعادة تعيين كلمة المرور</a></p><p>إذا لم تطلب هذا، تجاهل هذه الرسالة ولن يتغيّر شيء.</p>`,
	});
}
