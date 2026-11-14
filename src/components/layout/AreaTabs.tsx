import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type AreaTab = { to: string; label: string; icon: LucideIcon };

/**
 * Tabs across the top of an area of the app (Documents, Tasks, Roster), so related screens
 * sit together under one menu item instead of each taking a line in the sidebar.
 */
export function AreaTabs({
	label,
	tabs,
}: {
	label: string;
	tabs: readonly AreaTab[];
}) {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	// The longest matching tab wins, so /documents/registry doesn't also light up /documents.
	const current = [...tabs]
		.filter((t) => pathname === t.to || pathname.startsWith(`${t.to}/`))
		.sort((a, b) => b.to.length - a.to.length)[0]?.to;
	return (
		<nav aria-label={label} className="-mx-1 overflow-x-auto">
			<ul className="flex min-w-max gap-1 border-b px-1">
				{tabs.map((t) => {
					const active = t.to === current;
					const Icon = t.icon;
					return (
						<li key={t.to}>
							<Link
								to={t.to}
								aria-current={active ? "page" : undefined}
								className={cn(
									"-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
									active
										? "border-primary text-foreground"
										: "border-transparent text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon className="h-4 w-4" aria-hidden />
								{t.label}
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
