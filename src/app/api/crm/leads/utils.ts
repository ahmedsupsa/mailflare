export function sanitizePhones(phones: unknown): string[] {
	if (!Array.isArray(phones)) return [];
	return phones
		.map((phone) => (typeof phone === "string" ? phone.trim() : ""))
		.filter(Boolean)
		.slice(0, 10);
}

export function serializePhones(phones: string[]): string {
	return JSON.stringify(phones);
}

export function parsePhones(value: string): string[] {
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.filter((phone): phone is string => typeof phone === "string") : [];
	} catch {
		return [];
	}
}
