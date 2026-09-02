"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { SidebarProviderProps, SidebarState } from "./sidebar-state-types";

const SidebarContext = createContext<SidebarState>({
	minimal: false,
	toggle: () => undefined,
	mobileOpen: false,
	openMobile: () => undefined,
	closeMobile: () => undefined,
	toggleMobile: () => undefined,
});

export function SidebarProvider({ children, expandedWidth = 240 }: SidebarProviderProps) {
	const [minimal, setMinimal] = useState(false);
	const [storageKey, setStorageKey] = useState<string | null>(null);
	const [mobileOpen, setMobileOpen] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		void fetch("/api/auth/me", { cache: "no-store" })
			.then((response) => response.json() as Promise<{ user?: { id?: string } }>)
			.then((data) => {
				if (!data.user?.id) return;
				const key = `mailflare-sidebar-minimal:${data.user.id}`;
				setStorageKey(key);
				setMinimal(localStorage.getItem(key) === "true");
			});
	}, []);

	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	function toggle() {
		setMinimal((current) => {
			const next = !current;
			if (storageKey) localStorage.setItem(storageKey, String(next));
			return next;
		});
	}

	const openMobile = () => setMobileOpen(true);
	const closeMobile = () => setMobileOpen(false);
	const toggleMobile = () => setMobileOpen((current) => !current);

	return (
		<SidebarContext.Provider value={{ minimal, toggle, mobileOpen, openMobile, closeMobile, toggleMobile }}>
			<div className="h-full" style={{ "--sidebar-width": `${minimal ? 72 : expandedWidth}px` } as React.CSSProperties}>
				{children}
			</div>
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	return useContext(SidebarContext);
}
