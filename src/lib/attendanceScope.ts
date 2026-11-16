import { getRoles } from "./access";

/**
 * Who may open the Attendance Registry, and whose attendance they see (product owner, 14 Nov):
 * HR, the GM and the RGM see everyone; a Department Head sees their department and its units;
 * a Unit Head sees their unit; a Station or Team Head (supervisor) sees their own unit.
 */
export const ATTENDANCE_VIEWERS = [
	"SUPER_ADMIN",
	"ORG_ADMIN",
	"HR",
	"GM",
	"RGM",
	"ACOS", // head of the Aviation Security department
	"HOD",
	"HOU",
	"MANAGER",
	"SUPERVISOR",
	"STATION_HEAD",
	"TEAM_HEAD",
] as const;

const ORG_WIDE = ["SUPER_ADMIN", "ORG_ADMIN", "HR", "GM", "RGM"];

type Dept = { id: string; name: string; parentDepartmentId?: string | null };
type User = Parameters<typeof getRoles>[0] & { departmentId?: string | null };

export type AttendanceScope =
	| { kind: "all"; label: string }
	/** Runs one terminal (head of terminal, Terminal Operations Officer, Airport Duty Officer). */
	| { kind: "terminal"; code: string; label: string }
	| { kind: "departments"; ids: string[]; label: string }
	| { kind: "none"; label: string };

/** The departments whose staff this person may see in the registry. */
export function attendanceScope(
	user: User,
	departments: Dept[],
	/** The one terminal this person runs, if any (see placeOf in the duty board). */
	runsTerminal?: string | null,
): AttendanceScope {
	const roles = getRoles(user);
	if (roles.some((r) => ORG_WIDE.includes(r))) return { kind: "all", label: "Everyone in the organisation" };
	if (!roles.some((r) => (ATTENDANCE_VIEWERS as readonly string[]).includes(r))) {
		// Running a terminal is what gives an officer the registry, for that terminal only.
		if (runsTerminal)
			return { kind: "terminal", code: runsTerminal, label: `Everyone at ${runsTerminal}, from every department` };
		return { kind: "none", label: "You don't have access to the attendance registry." };
	}
	const own = departments.find((d) => d.id === user?.departmentId);
	if (!own) return { kind: "none", label: "Your profile has no department or unit, so there is no one to show." };
	// The person's own department or unit and everything below it.
	const ids = [own.id];
	for (let i = 0; i < ids.length; i++)
		for (const d of departments) if (d.parentDepartmentId === ids[i] && !ids.includes(d.id)) ids.push(d.id);
	const below = ids.length - 1;
	return { kind: "departments", ids, label: below ? `${own.name} and its ${below} unit${below === 1 ? "" : "s"}` : own.name };
}
