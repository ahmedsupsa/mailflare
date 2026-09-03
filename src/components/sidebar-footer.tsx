import { useBranding } from "./branding-provider";
import { useSidebar } from "./sidebar-state";

export function SidebarFooter() {
	const { minimal } = useSidebar();
	const branding = useBranding();
	if (minimal) return null;
	return (
		<p className="px-3 pt-3 text-xs text-neutral-400">
			مقدَّم من{" "}
			{branding.websiteUrl ? (
				<a href={branding.websiteUrl} target="_blank" rel="noopener noreferrer">
					{branding.appName}
				</a>
			) : (
				branding.appName
			)}
		</p>
	);
}
