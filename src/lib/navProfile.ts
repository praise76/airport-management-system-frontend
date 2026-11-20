import { getRoles, ROLE_GROUPS } from "@/lib/access";

/**
 * What kind of day a person has, which decides their short menu and what their Today screen
 * shows. Someone with several roles gets the first that fits, top to bottom.
 */
export type Profile =
	| "admin"
	| "executive"
	| "registry"
	| "hr"
	| "manager"
	| "supervisor"
	| "auditor"
	| "staff";

type U = { role?: string; roles?: string[]; type?: string } | null | undefined;

const in_ = (roles: string[], list: readonly string[]) => roles.some((r) => list.includes(r));

export function profileOf(user: U, runsTerminal = false): Profile {
	const roles = getRoles(user);
	if (in_(roles, ROLE_GROUPS.admins)) return "admin";
	if (in_(roles, ["RGM", "GM", "DIRECTOR", "MD"])) return "executive";
	if (in_(roles, ["REGISTRY_CLERK"])) return "registry";
	if (in_(roles, ["HR"])) return "hr";
	if (in_(roles, ["HOD", "MANAGER", "ACOS"])) return "manager";
	if (in_(roles, ["HOU", "SUPERVISOR"]) || runsTerminal) return "supervisor";
	if (in_(roles, ["AUDITOR"])) return "auditor";
	return "staff";
}

/**
 * The menu entries (by address) each profile sees up front. Anything else the person is allowed to
 * open stays reachable under "More": nothing is taken away, it is just out of the daily way.
 */
export const PRIMARY_NAV: Record<Profile, string[]> = {
	staff: ["/", "/roster/my-shifts", "/attendance", "/messages", "/documents", "/tasks"],
	supervisor: [
		"/",
		"/roster/my-shifts",
		"/attendance",
		"/messages",
		"/documents",
		"/tasks",
		"/public/duty-board",
		"/admin/leave/approvals",
	],
	manager: [
		"/",
		"/messages",
		"/documents",
		"/tasks",
		"/public/duty-board",
		"/admin/roster/planner",
		"/admin/leave/approvals",
		"/admin/attendance/registry",
		"/inventory/requisitions",
	],
	executive: [
		"/",
		"/messages",
		"/documents",
		"/tasks",
		"/public/duty-board",
		"/rgm",
		"/stakeholders",
		"/admin/attendance/registry",
		"/reports",
	],
	hr: [
		"/",
		"/messages",
		"/documents",
		"/admin/staff",
		"/admin/attendance/registry",
		"/admin/leave/approvals",
		"/reports",
	],
	registry: ["/", "/documents/registry", "/documents", "/tasks", "/messages"],
	admin: [
		"/",
		"/messages",
		"/documents",
		"/admin/staff",
		"/organizations",
		"/departments",
		"/positions",
		"/admin/attendance/registry",
		"/reports",
	],
	auditor: ["/", "/reports", "/documents", "/admin/attendance/registry", "/messages"],
};

type Item = { to: string };
type Group<I extends Item> = { label: string; items: I[] };

/**
 * Split the items a person may open into the short menu and "More". The short menu keeps the
 * groups' own order; "More" keeps the groups, so it is still easy to find things in.
 */
export function splitNav<I extends Item, G extends Group<I>>(
	groups: G[],
	profile: Profile,
): { primary: I[]; more: G[] } {
	const wanted = PRIMARY_NAV[profile];
	const all = groups.flatMap((g) => g.items);
	const primary = wanted
		.map((to) => all.find((item) => item.to === to))
		.filter((item): item is I => !!item);
	const shown = new Set(primary.map((item) => item.to));
	const more = groups
		.map((g) => ({ ...g, items: g.items.filter((item) => !shown.has(item.to)) }))
		.filter((g) => g.items.length > 0);
	return { primary, more };
}
