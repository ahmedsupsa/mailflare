"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isActiveSettingsPath, settingsNavSections } from "./settings-nav-utils";

export function SettingsNav({ className }: { className?: string }) {
	const pathname = usePathname();

	return (
		<aside
			className={cn(
				"border-neutral-100/70 px-4 py-4 lg:min-h-full lg:w-64 lg:shrink-0 lg:border-e lg:py-10",
				className,
			)}
		>
			<div className="space-y-4 lg:sticky lg:top-6 lg:space-y-7">
				{settingsNavSections.map((section) => (
					<div key={section.label} className="space-y-2 lg:space-y-3">
						<h2 className="px-4 text-xs font-semibold uppercase tracking-wide text-neutral-500 lg:px-4">
							{section.label}
						</h2>
						<nav className="flex gap-2 overflow-x-auto px-4 pb-1 lg:block lg:space-y-px lg:overflow-visible lg:px-0 lg:pb-0">
							{section.items.map((item) => {
								const active = isActiveSettingsPath(pathname, item.href);
								return (
									<Link
										key={item.href}
										href={item.href}
										className={cn(
											"shrink-0 whitespace-nowrap rounded-full border border-transparent px-4 py-1.5 text-sm font-medium transition-colors lg:block lg:border-0",
											active
												? "bg-neutral-100 text-neutral-900"
												: "bg-white text-neutral-600 hover:bg-white/70 hover:text-neutral-900 lg:bg-transparent",
										)}
									>
										{item.label}
									</Link>
								);
							})}
						</nav>
					</div>
				))}
			</div>
		</aside>
	);
}
