import type { ReactNode } from "react";

export type SidebarState = {
	minimal: boolean;
	toggle(): void;
	mobileOpen: boolean;
	openMobile(): void;
	closeMobile(): void;
	toggleMobile(): void;
};

export type SidebarProviderProps = {
	children: ReactNode;
	expandedWidth?: number;
};

export type SidebarHeaderProps = {
	href: string;
	label?: string;
};
