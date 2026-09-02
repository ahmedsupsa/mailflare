"use client";

import { Menu } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-state";

export function MobileMenuButton({ className }: { className?: string }) {
	const { openMobile } = useSidebar();
	return (
		<button
			type="button"
			onClick={openMobile}
			className={cn(
				"flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200 lg:hidden",
				className,
			)}
			aria-label="فتح القائمة"
		>
			<Menu className="h-5 w-5" />
		</button>
	);
}

export function MobileSidebarBackdrop() {
	const { mobileOpen, closeMobile } = useSidebar();
	if (!mobileOpen) return null;
	return (
		<div
			role="presentation"
			onClick={closeMobile}
			className="fixed inset-0 z-30 bg-black/40 lg:hidden"
		/>
	);
}

export function ResponsiveAside({ children, className }: { children: ReactNode; className?: string }) {
	const { mobileOpen } = useSidebar();
	return (
		<aside
			className={cn(
				"fixed inset-y-0 start-0 z-40 w-72 overflow-y-auto overscroll-contain bg-[#f6f8fc] px-3 py-4 shadow-xl transition-transform duration-200 scrollbar-gutter-stable",
				mobileOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
				"lg:static lg:z-auto lg:w-auto lg:translate-x-0 lg:shadow-none lg:rtl:translate-x-0",
				className,
			)}
		>
			{children}
		</aside>
	);
}
