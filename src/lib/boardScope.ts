import { getRoles } from "./access";

/**
 * Who sees what on the duty board (product owner, 15 Nov): junior staff see everyone on duty at
 * their terminal, all departments; Heads of Unit see their unit and HODs (and ACOS) their
 * department across every terminal; the RGM, GM, HR and admins see every terminal.
 */
const ALL = ["SUPER_ADMIN", "ORG_ADMIN", "RGM", "GM", "HR"];
const DEPARTMENT_HEADS = ["HOD", "ACOS"];
const UNIT_HEADS = ["HOU", "MANAGER"];

type Dept = { id: string; name: string; parentDepartmentId?: string | null };
type User = Parameters<typeof getRoles>[0] & { departmentId?: string | null };

export type BoardScope =
	| { kind: "all"; label: string }
	| { kind: "departments"; ids: string[]; label: string }
	| { kind: "terminal"; code: string; label: string; runsIt?: boolean }
	/** Junior staff of a unit that works around the airport (e.g. Wildlife and Bird Control). */
	| { kind: "airport"; label: string }
	| { kind: "none"; label: string };

export type BoardPlace = {
	/** The person's unit works around the airport (e.g. Wildlife and Bird Control). */
	roaming?: boolean;
	/** The person runs a terminal (head of terminal, TOO, Airport Duty Officer): that terminal's code. */
	runsTerminal?: string | null;
	/** Covers the whole airport (no such role at MMIA today; kept for completeness). */
	airportDuty?: boolean;
};

export function boardScope(
	user: User,
	departments: Dept[],
	myTerminal: string | null,
	terminalName?: string,
	place: BoardPlace | boolean = {},
): BoardScope {
	const roles = getRoles(user);
	const where: BoardPlace =
		typeof place === "boolean" ? { roaming: place } : place;
	if (roles.some((r) => ALL.includes(r)) || where.airportDuty)
		return { kind: "all", label: "Every terminal" };
	if (where.runsTerminal)
		return {
			kind: "terminal",
			code: where.runsTerminal,
			label: terminalName ?? where.runsTerminal,
			runsIt: true,
		};
	if (
		roles.some((r) => DEPARTMENT_HEADS.includes(r) || UNIT_HEADS.includes(r))
	) {
		const own = departments.find((d) => d.id === user?.departmentId);
		if (own) {
			const ids = [own.id];
			for (let i = 0; i < ids.length; i++)
				for (const d of departments)
					if (d.parentDepartmentId === ids[i] && !ids.includes(d.id))
						ids.push(d.id);
			return { kind: "departments", ids, label: `${own.name}, every terminal` };
		}
	}
	if (where.roaming)
		return {
			kind: "airport",
			label: "The whole airport (your unit works around the airport)",
		};
	if (myTerminal)
		return {
			kind: "terminal",
			code: myTerminal,
			label: terminalName ?? myTerminal,
		};
	return {
		kind: "none",
		label: "Clock in at your terminal to see who is on duty there.",
	};
}

type Session = {
	terminalCode?: string | null;
	startedAt?: string | null;
	endedAt?: string | null;
};
type Shift = {
	dutyDate: string;
	shiftStartTime?: string | null;
	shiftEndTime?: string | null;
	terminalId?: string | null;
};

/**
 * The terminal a person is at today: the terminal of their open clock-in, otherwise the terminal of
 * the shift they are on now (a night shift that began yesterday counts), otherwise today's shift.
 */
export function todaysTerminal(
	sessions: Session[],
	shifts: Shift[],
	terminals: { id: string; terminalCode: string }[],
	now: Date = new Date(),
): string | null {
	const open = sessions
		.filter((s) => s.terminalCode && !s.endedAt)
		.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)))[0];
	if (open?.terminalCode) return open.terminalCode;
	const code = (id?: string | null) =>
		terminals.find((t) => t.id === id)?.terminalCode ?? null;
	const day = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	const today = day(now);
	const yesterday = day(new Date(now.getTime() - 864e5));
	const at = (date: string, time?: string | null, plusDay = false) => {
		const [h, m] = String(time ?? "00:00")
			.split(":")
			.map(Number);
		const [y, mo, d] = date.slice(0, 10).split("-").map(Number);
		return new Date(y, mo - 1, d + (plusDay ? 1 : 0), h, m).getTime();
	};
	const t = now.getTime();
	for (const s of shifts) {
		const date = String(s.dutyDate).slice(0, 10);
		if (date !== today && date !== yesterday) continue;
		const overnight = String(s.shiftEndTime) < String(s.shiftStartTime);
		if (
			t >= at(date, s.shiftStartTime) &&
			t < at(date, s.shiftEndTime, overnight)
		)
			return code(s.terminalId);
	}
	const later = shifts.find((s) => String(s.dutyDate).slice(0, 10) === today);
	return later ? code(later.terminalId) : null;
}
