import type { SetupRequirementCheck } from "./types";

export function getSetupRequirementChecks(env: CloudflareEnv): SetupRequirementCheck[] {
	const hasApiToken = !!env.CF_TOKEN?.trim();
	const hasGlobalKey = !!env.CF_API_KEY?.trim() && !!env.CF_EMAIL?.trim();

	return [
		{
			key: "بيانات اعتماد Cloudflare API",
			configured: hasApiToken || hasGlobalKey,
			message: "اضبط CF_TOKEN، أو اضبط كلًا من CF_API_KEY وCF_EMAIL.",
		},
		{
			key: "اسم Email Worker",
			configured: !!env.CF_EMAIL_WORKER_NAME?.trim(),
			message: "اضبط CF_EMAIL_WORKER_NAME على اسم الـ Worker الذي تم نشره.",
		},
		{
			key: "قاعدة بيانات D1",
			configured: !!env.DB,
			message: "انشر الـ Worker مع ربط قاعدة البيانات (DB binding) من wrangler.jsonc.",
		},
	];
}
