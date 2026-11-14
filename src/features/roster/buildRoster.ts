import { addDays, crewShiftOn, daysBetween } from "./crews";
import { planCrews } from "./patternPresets";
import type { ShiftDefinition, ShiftPattern } from "./types";

/**
 * Turn a pattern and the teams working it into roster shifts, so a planner chooses the
 * pattern while creating the roster instead of filling the grid by hand.
 */

type Pattern = Pick<ShiftPattern, "cycleLengthDays" | "shiftSequenceJson">;

export type TeamPlan = {
	name: string;
	/** yyyy-mm-dd: the day this team is on day 1 of the pattern. */
	startDate: string;
	memberIds: string[];
};

export type PlannedShift = {
	staffId: string;
	dutyDate: string;
	shift: string;
	shiftStartTime: string;
	shiftEndTime: string;
	shiftGroup: string;
};

/** Default hours when the unit has no shift times of its own. "day" and 12-hour nights pair up. */
const DEFAULTS: Record<string, [string, string]> = {
	morning: ["06:00", "14:00"],
	afternoon: ["14:00", "22:00"],
	night: ["22:00", "06:00"],
	day: ["07:00", "19:00"],
};

/** Start and end time for a shift code: the unit's own shift of that name if it has one. */
export function shiftTimes(
	code: string,
	pattern: Pattern,
	definitions: Pick<ShiftDefinition, "name" | "startTime" | "endTime">[] = [],
): { start: string; end: string } {
	// A 12-hour pattern ("day" shifts) has 12-hour nights; an 8-hour pattern, 8-hour shifts.
	const twelveHour = pattern.shiftSequenceJson.some((s) => s.shift === "day");
	const own = definitions.find(
		(d) =>
			d.name?.toLowerCase().startsWith(code) &&
			hoursOf(d.startTime, d.endTime) >= 11 === twelveHour,
	);
	if (own)
		return { start: own.startTime.slice(0, 5), end: own.endTime.slice(0, 5) };
	if (code === "night" && twelveHour) return { start: "19:00", end: "07:00" };
	const [start, end] = DEFAULTS[code] ?? ["08:00", "16:00"];
	return { start, end };
}

/** Length of a shift in hours, across midnight if it ends earlier than it starts. */
function hoursOf(start: string, end: string): number {
	const m = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
	return ((m(end) - m(start) + 1440) % 1440 || 1440) / 60;
}

/** Days where a working shift has no team or more than one team. */
export function coverProblems(
	pattern: Pattern,
	shifts: PlannedShift[],
	from: string,
	to: string,
): { date: string; shift: string; teams: number }[] {
	const working = [
		...new Set(
			pattern.shiftSequenceJson.map((x) => x.shift).filter((x) => x !== "off"),
		),
	];
	const out: { date: string; shift: string; teams: number }[] = [];
	for (const date of datesBetween(from, to))
		for (const shift of working) {
			const teams = new Set(
				shifts
					.filter((x) => x.dutyDate === date && x.shift === shift)
					.map((x) => x.shiftGroup),
			).size;
			if (teams !== 1) out.push({ date, shift, teams });
		}
	return out;
}

/** Every date from `from` to `to`, inclusive. */
export function datesBetween(from: string, to: string): string[] {
	const n = daysBetween(from, to);
	return n < 0 ? [] : Array.from({ length: n + 1 }, (_, i) => addDays(from, i));
}

/** One shift per team member per working day of the pattern within the roster's dates. */
export function planShifts(input: {
	pattern: Pattern;
	teams: TeamPlan[];
	from: string;
	to: string;
	definitions?: Pick<ShiftDefinition, "name" | "startTime" | "endTime">[];
}): PlannedShift[] {
	const out: PlannedShift[] = [];
	for (const date of datesBetween(input.from, input.to)) {
		for (const team of input.teams) {
			const code = crewShiftOn(input.pattern, team.startDate, date);
			if (!code || code === "off") continue;
			const { start, end } = shiftTimes(code, input.pattern, input.definitions);
			for (const staffId of team.memberIds)
				out.push({
					staffId,
					dutyDate: date,
					shift: code,
					shiftStartTime: start,
					shiftEndTime: end,
					shiftGroup: team.name,
				});
		}
	}
	return out;
}

/**
 * Suggested day-1 dates for the teams so the pattern gives full cover from the roster's
 * first day: the first team starts that day, the others are staggered by the pattern's plan.
 */
export function suggestTeamStarts(
	pattern: Pattern,
	rosterStart: string,
	count: number,
): string[] {
	const plan = planCrews(pattern);
	const offsets = plan?.offsets ?? [];
	return Array.from({ length: count }, (_, i) =>
		addDays(rosterStart, -(offsets[i] ?? 0)),
	);
}
