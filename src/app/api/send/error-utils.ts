export function getSendErrorStatus(message: string): number {
	if (message === "صندوق البريد مطلوب") return 400;
	if (
		message === "صندوق البريد غير موجود" ||
		message === "حساب المرسل غير موجود" ||
		message === "ليس لديك إذن للإرسال من صندوق البريد هذا" ||
		message === "عنوان المرسل لا يطابق صندوق البريد المحدد"
	) {
		return 403;
	}
	return 500;
}
