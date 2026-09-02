import { Archive, Clock, MailOpen, Send, ShieldAlert, Star, Trash2 } from "lucide-react";
import type { MessageFolderConfig } from "./types";

export const inboxFolderConfig: MessageFolderConfig = {
	folder: "inbox",
	title: "البريد الوارد",
	emptyText: "لا توجد رسائل",
	hrefPrefix: "/inbox",
	icon: Star,
	// headerIcons: [MailOpen, Clock],
	showRowBadge: false,
};

export const starredFolderConfig: MessageFolderConfig = {
	folder: "starred",
	title: "المميزة بنجمة",
	emptyText: "لا توجد رسائل مميزة بنجمة",
	hrefPrefix: "/starred",
	icon: Star,
	badgeVariant: "outline",
};

export const snoozedFolderConfig: MessageFolderConfig = {
	folder: "snoozed",
	title: "المؤجلة",
	emptyText: "لا توجد رسائل مؤجلة",
	hrefPrefix: "/snoozed",
	icon: Clock,
	badgeVariant: "outline",
};

export const sentFolderConfig: MessageFolderConfig = {
	folder: "sent",
	title: "المرسلة",
	emptyText: "لا توجد رسائل",
	hrefPrefix: "/sent",
	icon: Send,
	// headerIcons: [MailOpen, Clock],
	badgeVariant: "outline",
};

export const archivedFolderConfig: MessageFolderConfig = {
	folder: "archived",
	title: "الأرشيف",
	emptyText: "لا توجد رسائل مؤرشفة",
	hrefPrefix: "/archived",
	icon: Archive,
	badgeVariant: "outline",
};

export const spamFolderConfig: MessageFolderConfig = {
	folder: "spam",
	title: "البريد المزعج",
	emptyText: "لا يوجد بريد مزعج",
	hrefPrefix: "/spam",
	icon: ShieldAlert,
	badgeVariant: "outline",
};

export const trashFolderConfig: MessageFolderConfig = {
	folder: "trash",
	title: "المهملات",
	emptyText: "لا توجد رسائل في المهملات",
	hrefPrefix: "/trash",
	icon: Trash2,
	badgeVariant: "outline",
};
