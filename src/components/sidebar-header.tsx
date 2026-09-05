"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBranding } from "./branding-provider";
import { useSidebar } from "./sidebar-state";
import type { SidebarHeaderProps } from "./sidebar-state-types";

export function SidebarHeader({ href, label }: SidebarHeaderProps) {
	const branding = useBranding();
	const { minimal, toggle } = useSidebar();
	return (
		<div className={cn("mb-3 flex h-10 items-center gap-2 px-1", minimal && "lg:justify-center lg:gap-0 lg:px-0")}>
			<button
				type="button"
				onClick={toggle}
				className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-600 hover:bg-neutral-200"
				aria-label={minimal ? "توسيع القائمة" : "طي القائمة"}
			>
				<Menu className={cn("h-5 w-5", minimal && "lg:hidden")} />
				{minimal && <img src={branding.iconUrl} height={28} width={28} alt="" className="hidden lg:block" />}
			</button>
			<Link href={href} className={cn("flex min-w-0 items-center gap-3", minimal && "lg:hidden")}>
				<img src={branding.iconUrl} height={28} width={28} alt="" />
				<span className="truncate text-lg font-semibold text-neutral-800">{label ?? branding.appName}</span>
			</Link>
		</div>
	);
}
