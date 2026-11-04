/**
 * Checks a roster for problems a supervisor should see before publishing it.
 * Runs entirely in the browser on the roster's entries, so it works with the
 * current backend. If the backend later enforces the same rules, keep these as
 * an early warning.
 */

export const MIN_REST_HOURS = 8;
export const MAX_CONSECUTIVE_DAYS = 6;

export type RosterWarningKind =
	| "double_booked"
	| "short_rest"
	| "too_many_days"
	| "empty_shift";

export interface RosterWarning {
	kind: RosterWarningKind;
	staffId?: string;
	date: string; // YYYY-MM-DD
	message: string;
}

export interface CheckableEntry {
	staffId: string;
	dutyDate: string; // YYYY-MM-DD or ISO
	shift?: string;
	shiftDefinitionId?: string;
	shiftStartTime?: string; // "06:00" or "06:00:00"
	shiftEndTime?: string;
}

const day = (d: string) => d.slice(0, 10);

function toMinutes(t?: string): number | null {
	if (!t) return null;
	const [h, m] = t.split(":").map(Number);
	if (Number.isNaN(h)) return null;
	return h * 60 + (Number.isNaN(m) ? 0 : m);
}

/** Start and end of an entry in minutes since 1970, handling shifts that end after midnight. */
function span(e: CheckableEntry): { start: number; end: number } | null {
	const s = toMinutes(e.shiftStartTime);
	const f = toMinutes(e.shiftEndTime);
	if (s === null || f === null) return null;
	const base = Date.parse(`${day(e.dutyDate)}T00:00:00Z`) / 60000;
	if (Number.isNaN(base)) return null;
	const start = base + s;
	const end = base + f + (f <= s ? 24 * 60 : 0);
	return { start, end };
}

const fmtDate = (d: string) =>
	new Date(`${day(d)}T12:00:00Z`).toLocaleDateString("en-GB", {
		weekday: "short",
		day: "numeric",
		month: "short",
	});

export function checkRoster(
	entries: CheckableEntry[],
	options: {
		nameOf?: (staffId: string) => string;
		/** Shifts that should have at least one person every day (the unit's shift definitions). */
		requiredShifts?: { id?: string; name: string }[];
		/** Every date in the roster period, YYYY-MM-DD. Needed for the empty-shift check. */
		dates?: string[];
	} = {},
): RosterWarning[] {
	const nameOf = options.nameOf ?? ((id: string) => id);
	const warnings: RosterWarning[] = [];

	const byStaff = new Map<string, CheckableEntry[]>();
	for (const e of entries) {
		if (!e.staffId) continue;
		const list = byStaff.get(e.staffId) ?? [];
		list.push(e);
		byStaff.set(e.staffId, list);
	}

	for (const [staffId, list] of byStaff) {
		const name = nameOf(staffId);

		// 1. Two shifts on the same day.
		const perDay = new Map<string, number>();
		for (const e of list) perDay.set(day(e.dutyDate), (perDay.get(day(e.dutyDate)) ?? 0) + 1);
		for (const [d, n] of perDay) {
			if (n > 1)
				warnings.push({
					kind: "double_booked",
					staffId,
					date: d,
					message: `${name} has ${n} shifts on ${fmtDate(d)}.`,
				});
		}

		// 2. Not enough rest between the end of one shift and the start of the next.
		const spans = list
			.map((e) => ({ e, t: span(e) }))
			.filter((x): x is { e: CheckableEntry; t: { start: number; end: number } } => !!x.t)
			.sort((a, b) => a.t.start - b.t.start);
		for (let i = 1; i < spans.length; i++) {
			const restMin = spans[i].t.start - spans[i - 1].t.end;
			if (restMin >= 0 && restMin < MIN_REST_HOURS * 60) {
				const hours = Math.round((restMin / 60) * 10) / 10;
				warnings.push({
					kind: "short_rest",
					staffId,
					date: day(spans[i].e.dutyDate),
					message: `${name} gets only ${hours} h rest before the ${spans[i].e.shift ?? ""} shift on ${fmtDate(spans[i].e.dutyDate)} (minimum ${MIN_REST_HOURS} h).`,
				});
			}
		}

		// 3. Too many working days in a row.
		const days = [...new Set(list.map((e) => day(e.dutyDate)))].sort();
		let run = 1;
		for (let i = 1; i <= days.length; i++) {
			const prev = Date.parse(days[i - 1]);
			const cur = i < days.length ? Date.parse(days[i]) : Number.NaN;
			if (cur - prev === 86400000) {
				run++;
				continue;
			}
			if (run > MAX_CONSECUTIVE_DAYS)
				warnings.push({
					kind: "too_many_days",
					staffId,
					date: days[i - 1],
					message: `${name} works ${run} days in a row, ending ${fmtDate(days[i - 1])} (maximum ${MAX_CONSECUTIVE_DAYS}).`,
				});
			run = 1;
		}
	}

	// 4. A shift nobody is covering on a given day.
	if (options.requiredShifts?.length && options.dates?.length) {
		for (const d of options.dates) {
			for (const def of options.requiredShifts) {
				const shiftName = def.name;
				const covered = entries.some(
					(e) =>
						day(e.dutyDate) === d &&
						((def.id && e.shiftDefinitionId === def.id) ||
							(e.shift ?? "").toLowerCase() === shiftName.toLowerCase() ||
							shiftName.toLowerCase().startsWith((e.shift ?? "~").toLowerCase())),
				);
				if (!covered)
					warnings.push({
						kind: "empty_shift",
						date: d,
						message: `Nobody is on the ${shiftName} shift on ${fmtDate(d)}.`,
					});
			}
		}
	}

	return warnings.sort((a, b) => a.date.localeCompare(b.date));
}

export const WARNING_TITLES: Record<RosterWarningKind, string> = {
	double_booked: "Booked twice on one day",
	short_rest: "Not enough rest between shifts",
	too_many_days: "Too many days in a row",
	empty_shift: "Shift with nobody on it",
};
