/**
 * Picks the staff who belong on a unit's roster.
 *
 * A staff member is stored with one department ID, which is their unit when they have
 * one, otherwise their department. The staff list endpoint may or may not filter by
 * department, so we also filter here, and always keep anyone already on the roster.
 */

export interface RosterPerson {
	id: string;
	firstName?: string;
	lastName?: string;
	avatarUrl?: string;
	position?: { name?: string } | null;
	departmentId?: string | null;
	department?: { id?: string; name?: string } | null;
	[key: string]: unknown;
}

function deptOf(u: RosterPerson): string | undefined {
	return (u.departmentId as string | undefined) ?? u.department?.id ?? undefined;
}

export function staffForUnit(
	fetched: RosterPerson[],
	opts: {
		unitId?: string | null;
		departmentId?: string | null;
		/** People already on the roster, e.g. from entry.user. */
		alreadyRostered?: RosterPerson[];
	},
): { staff: RosterPerson[]; filtered: boolean } {
	const unitId = opts.unitId ?? undefined;
	const deptId = opts.departmentId ?? undefined;
	const inUnit = fetched.filter((u) => unitId && deptOf(u) === unitId);
	const inDept = fetched.filter((u) => deptId && deptOf(u) === deptId);

	const byId = new Map<string, RosterPerson>();
	// Full staff records first (they have position etc.); roster copies only fill gaps.
	for (const u of [...inUnit, ...inDept, ...(opts.alreadyRostered ?? [])]) {
		if (u?.id && !byId.has(u.id)) byId.set(u.id, u);
	}

	// Nothing tells us who is in the unit (no department on the records): show the list as
	// fetched, and let the screen say so.
	if (byId.size === 0) return { staff: fetched, filtered: false };

	const staff = [...byId.values()].sort((a, b) =>
		`${a.firstName ?? ""} ${a.lastName ?? ""}`.localeCompare(`${b.firstName ?? ""} ${b.lastName ?? ""}`),
	);
	return { staff, filtered: true };
}

export const fullName = (u?: { firstName?: string; lastName?: string } | null) =>
	`${u?.firstName ?? ""} ${u?.lastName ?? ""}`.trim() || "Unknown";
