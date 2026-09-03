import type { ReactNode } from "react";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100dvh-4rem)] bg-inherit">
			<div className="order-2 min-w-0 flex-1 pt-4 lg:order-1">
				<div className="mx-auto w-full max-w-3xl px-4 lg:px-0">{children}</div>
			</div>
			<SettingsNav className="order-1 lg:order-2" />
		</div>
	);
}
