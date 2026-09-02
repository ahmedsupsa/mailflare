import type { LicenseActivationInput, LicenseDeactivationInput, PaymugLicenseAction, PaymugLicenseResponse } from "./types";
import { parsePaymugLicenseResponse } from "./utils";

export const PAYMUG_BASE_URL = "https://app.paymug.co";

export async function callPaymugLicenseApi(
	action: PaymugLicenseAction,
	input: LicenseActivationInput | LicenseDeactivationInput,
): Promise<PaymugLicenseResponse> {
	let response: Response;

	console.log(input);
	
	try {
		response = await fetch(`${PAYMUG_BASE_URL}/api/v1/licenses/${action}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(input),
			signal: AbortSignal.timeout(15_000),
		});
	} catch {
		throw new Error("تعذر الوصول إلى Paymug. حاول مرة أخرى لاحقًا.");
	}

	const rs = await response.json()
	console.log('response', rs);

	if (!response.ok) {
		if (response.status === 409) {
			throw new Error("هذا الترخيص مُفعّل على تثبيت آخر. قم بإلغاء تفعيله هناك قبل إعادة المحاولة.");
		}
		if (response.status === 401 || response.status === 403) {
			throw new Error("رفض Paymug مفتاح الترخيص هذا.");
		}
		if (response.status >= 500) {
			throw new Error("خدمة Paymug غير متاحة مؤقتًا. حاول مرة أخرى لاحقًا.");
		}
		throw new Error("تعذر على Paymug معالجة طلب الترخيص هذا.");
	}

	try {
		return parsePaymugLicenseResponse(rs);
	} catch {
		throw new Error("أعاد Paymug استجابة ترخيص غير صالحة");
	}
}
