import type { FolderColorOption } from "./types";

export const FOLDER_COLOR_VALUES = [
	"#2563eb",
	"#7c3aed",
	"#db2777",
	"#dc2626",
	"#ea580c",
	"#d97706",
	"#16a34a",
	"#0d9488",
] as const;

export const DEFAULT_FOLDER_COLOR = FOLDER_COLOR_VALUES[0];

export const FOLDER_COLOR_OPTIONS: FolderColorOption[] = [
	{ value: "#2563eb", label: "أزرق" },
	{ value: "#7c3aed", label: "بنفسجي" },
	{ value: "#db2777", label: "وردي" },
	{ value: "#dc2626", label: "أحمر" },
	{ value: "#ea580c", label: "برتقالي" },
	{ value: "#d97706", label: "كهرماني" },
	{ value: "#16a34a", label: "أخضر" },
	{ value: "#0d9488", label: "أزرق مخضر" },
];
