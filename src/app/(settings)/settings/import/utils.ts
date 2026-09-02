import { authFetch } from "@/lib/auth/client";
import type {
	ImapFormState,
	ImportFolderSummary,
	ImportResult,
	ImportSourceItem,
	ImportSourceOption,
	ImportSourceSection,
} from "./types";

export const importSourceOptions: ImportSourceOption[] = [
	{ value: "inbox", label: "البريد الوارد", imapFolder: "INBOX", destination: "system:inbox", system: true },
	{ value: "sent", label: "المرسل", imapFolder: "Sent", destination: "system:sent", system: true },
	{ value: "drafts", label: "المسودات", imapFolder: "Drafts", destination: "system:drafts", system: true },
	{ value: "archived", label: "الأرشيف", imapFolder: "Archive", destination: "system:archived", system: true },
	{ value: "spam", label: "البريد المزعج", imapFolder: "Spam", destination: "system:spam", system: true },
	{ value: "trash", label: "المحذوفات", imapFolder: "Trash", destination: "system:trash", system: true },
	{ value: "others", label: "أخرى", imapFolder: "", destination: "system:inbox" },
];

export function getImportSourceOption(section: ImportSourceSection): ImportSourceOption {
	return importSourceOptions.find((option) => option.value === section) ?? importSourceOptions[0];
}

export function getSelectedImportSources(sections: ImportSourceSection[]): ImportSourceItem[] {
	return sections.map((section) => {
		const option = getImportSourceOption(section);
		return {
			id: `system:${option.value}`,
			label: option.label,
			imapFolder: option.imapFolder,
			destination: option.destination,
			sourceSection: option.value,
		};
	});
}

export function getFolderImportSource(folderName: string): ImportSourceItem {
	return {
		id: `folder:${folderName}`,
		label: folderName,
		imapFolder: folderName,
		destination: "",
		folderName,
	};
}

export function resolveImapSourceFolder(source: ImportSourceItem, folders: string[]): string {
	if (!source.sourceSection || source.sourceSection === "others") return source.imapFolder;
	const match = findFolderMatch(folders, getFolderAliases(source.sourceSection));
	return match ?? source.imapFolder;
}

export function filterCustomImapFolders(folders: string[], selectedSources: ImportSourceItem[]): string[] {
	const systemAliases = new Set(
		(["inbox", "sent", "drafts", "archived", "spam", "trash"] as ImportSourceSection[])
			.flatMap(getFolderAliases)
			.map(normalizeFolderName),
	);
	for (const source of selectedSources) {
		const folder = resolveImapSourceFolder(source, folders);
		if (folder) systemAliases.add(normalizeFolderName(folder));
	}
	return folders.filter((folder) => !systemAliases.has(normalizeFolderName(folder)));
}

export function getFileImportSource(sources: ImportSourceItem[]): ImportSourceItem {
	return sources.find((source) => source.id !== "system:others") ?? getSelectedImportSources(["inbox"])[0];
}

export async function ensureImportDestination(
	mailboxId: string,
	source: ImportSourceItem,
): Promise<string> {
	if (!source.folderName) return source.destination;
	const folders = await fetchMailboxFolders(mailboxId);
	const existing = folders.find((folder) => folder.name.toLowerCase() === source.folderName?.toLowerCase());
	if (existing) return `folder:${existing.id}`;

	const response = await authFetch("/api/folders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ mailboxId, name: source.folderName }),
	});
	const data = (await response.json()) as ImportFolderSummary & { error?: string };
	if (!response.ok) throw new Error(data.error ?? `تعذّر إنشاء المجلد ${source.folderName}`);
	return `folder:${data.id}`;
}

async function fetchMailboxFolders(mailboxId: string): Promise<ImportFolderSummary[]> {
	const params = new URLSearchParams({ mailboxId });
	const response = await authFetch(`/api/folders?${params.toString()}`);
	const data = (await response.json()) as { folders?: ImportFolderSummary[]; error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذّر تحميل المجلدات");
	return data.folders ?? [];
}

export async function importFromImap(
	mailboxId: string,
	form: ImapFormState,
	destination: string,
): Promise<ImportResult> {
	const response = await authFetch("/api/import/imap", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			mailboxId,
			destination,
			host: form.host,
			port: Number(form.port),
			secure: form.secure,
			username: form.username,
			password: form.password,
			folder: form.folder,
			limit: Number(form.limit),
		}),
	});
	const data = (await response.json()) as ImportResult;
	if (!response.ok) throw new Error(data.error ?? "فشل الاستيراد عبر IMAP");
	return data;
}

export async function fetchImapFolders(form: ImapFormState): Promise<string[]> {
	const response = await authFetch("/api/import/imap/folders", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			host: form.host,
			port: Number(form.port),
			secure: form.secure,
			username: form.username,
			password: form.password,
		}),
	});
	const data = (await response.json()) as { folders?: string[]; error?: string };
	if (!response.ok) throw new Error(data.error ?? "تعذّر عرض مجلدات IMAP");
	return data.folders ?? [];
}

export function formatImportResult(result: ImportResult | null): string {
	if (!result) return "";
	return `تم استيراد ${result.imported ?? 0}، وتخطي ${result.skipped ?? 0}`;
}

function findFolderMatch(folders: string[], aliases: string[]): string | null {
	const normalizedAliases = aliases.map(normalizeFolderName);
	return folders.find((folder) => normalizedAliases.includes(normalizeFolderName(folder))) ?? null;
}

function getFolderAliases(section: ImportSourceSection): string[] {
	if (section === "inbox") return ["INBOX", "Inbox"];
	if (section === "sent") return ["Sent", "Sent Mail", "[Gmail]/Sent Mail", "Sent Items"];
	if (section === "drafts") return ["Drafts", "[Gmail]/Drafts"];
	if (section === "archived") return ["Archive", "Archived", "[Gmail]/All Mail"];
	if (section === "spam") return ["Spam", "Junk", "Junk Email", "[Gmail]/Spam"];
	if (section === "trash") return ["Trash", "Deleted", "Deleted Items", "[Gmail]/Trash"];
	return [];
}

function normalizeFolderName(value: string): string {
	return value.toLowerCase().replace(/^\[gmail\]\//, "").replace(/\s+/g, " ").trim();
}
