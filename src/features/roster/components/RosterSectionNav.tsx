import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarRange, Users } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Tabs across the top of the roster area. Patterns and crews are part of building a roster
 * (a post is worked by a crew on a pattern of shifts), so they live here rather than as a
 * separate menu item.
 */
const TABS = [
	{ to: "/admin/roster/planner", label: "Rosters", icon: CalendarRange },
	{ to: "/roster/patterns", label: "Patterns & crews", icon: Users },
] as const;

export function RosterSectionNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return (
		<nav aria-label="Roster" className="-mx-1 overflow-x-auto">
			<ul className="flex min-w-max gap-1 border-b px-1">
				{TABS.map((t) => {
					const active = pathname === t.to || pathname.startsWith(`${t.to}/`);
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
