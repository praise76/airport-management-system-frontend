import type { ShiftPattern } from "./types";

/** Shift codes a pattern day can hold. "day" is a 12-hour day shift (07:00-19:00). */
export const PATTERN_SHIFT_OPTIONS: { value: string; label: string }[] = [
	{ value: "morning", label: "Morning" },
	{ value: "afternoon", label: "Afternoon" },
	{ value: "day", label: "Day (12 h)" },
	{ value: "night", label: "Night" },
	{ value: "off", label: "Off" },
];

export type PatternPreset = Omit<ShiftPattern, "id"> & {
	key: string;
	summary: string;
	/** Typical shift times for this pattern, shown as guidance. */
	hours: string;
};

const seq = (codes: string[]) => codes.map((shift, i) => ({ day: i + 1, shift }));

/**
 * The three patterns FAAN operations asked for:
 * - 4-shift 2-2-2-2: two afternoons, two mornings, two nights, two off (8-hour shifts),
 *   plus a forward-rotating version that avoids the 8-hour afternoon-to-morning gap.
 * - 12-hour 2-2-2: two days, two nights, two off.
 * - Permanent morning: Morning Monday to Friday, weekends off.
 */
export const PATTERN_PRESETS: PatternPreset[] = [
	{
		key: "four-shift",
		patternName: "4-shift 2-2-2-2 (A-A-M-M-N-N-Off-Off)",
		patternType: "rotating",
		cycleLengthDays: 8,
		shiftSequenceJson: seq(["afternoon", "afternoon", "morning", "morning", "night", "night", "off", "off"]),
		summary:
			"2 afternoons, 2 mornings, 2 nights, 2 off. 4 crews give 24-hour cover. Note: only 8 h rest from the last afternoon (ends 22:00) to the first morning (06:00).",
		hours: "Morning 06:00-14:00, Afternoon 14:00-22:00, Night 22:00-06:00",
	},
	{
		key: "four-shift-forward",
		patternName: "4-shift 2-2-2-2 forward (M-M-A-A-N-N-Off-Off)",
		patternType: "rotating",
		cycleLengthDays: 8,
		shiftSequenceJson: seq(["morning", "morning", "afternoon", "afternoon", "night", "night", "off", "off"]),
		summary:
			"Same shifts, rotating forward: at least 24 h rest at every changeover. 4 crews give 24-hour cover.",
		hours: "Morning 06:00-14:00, Afternoon 14:00-22:00, Night 22:00-06:00",
	},
	{
		key: "twelve-hour-2-2-2",
		patternName: "12-hour 2 days, 2 nights, 2 off",
		patternType: "rotating",
		cycleLengthDays: 6,
		shiftSequenceJson: seq(["day", "day", "night", "night", "off", "off"]),
		summary: "Two 12-hour days, two 12-hour nights, two days off. 3 crews give 24-hour cover.",
		hours: "Day 07:00-19:00, Night 19:00-07:00",
	},
	{
		key: "permanent-morning",
		patternName: "Permanent morning (Mon-Fri)",
		patternType: "permanent",
		cycleLengthDays: 7,
		// Day 1 is the Monday the pattern is assigned from.
		shiftSequenceJson: seq(["morning", "morning", "morning", "morning", "morning", "off", "off"]),
		summary: "Morning shift every weekday, weekends off. For staff who don't rotate.",
		hours: "Morning 08:00-16:00 (set by the Morning shift definition)",
	},
];

/** Hours worked per cycle, assuming 8-hour shifts except 12-hour Day and Night in a pattern that uses Day. */
export function hoursPerWeek(pattern: Pick<ShiftPattern, "cycleLengthDays" | "shiftSequenceJson">): number {
	const codes = pattern.shiftSequenceJson.map((s) => s.shift);
	const twelveHour = codes.includes("day");
	const hours = codes.reduce((h, c) => {
		if (c === "off") return h;
		if (c === "day" || (twelveHour && c === "night")) return h + 12;
		return h + 8;
	}, 0);
	return Math.round((hours / pattern.cycleLengthDays) * 7 * 10) / 10;
}

export type CrewPlan = {
	/** How many crews are needed. */
	crews: number;
	/** Each crew's start offset in days from the first crew's start date. */
	offsets: number[];
	/** Every working shift is covered by exactly one crew on every day of the cycle. */
	fullCover: boolean;
};

/**
 * Smallest set of evenly staggered crews that puts exactly one crew on each working shift
 * every day. For 2-2-2 that's 3 crews starting 0, 2 and 4 days apart; for M-A-N-Off it's
 * 4 crews two days apart. Returns null for patterns where even staggering can't do that
 * (for example permanent morning, which isn't meant to give 24-hour cover).
 */
export function planCrews(pattern: Pick<ShiftPattern, "cycleLengthDays" | "shiftSequenceJson">): CrewPlan | null {
	const n = pattern.cycleLengthDays;
	const byDay = new Map(pattern.shiftSequenceJson.map((s) => [s.day, s.shift]));
	const codeOn = (day: number) => byDay.get(((day % n) + n) % n + 1) ?? "off";
	const working = [...new Set(pattern.shiftSequenceJson.map((s) => s.shift).filter((s) => s !== "off"))];
	if (!n || working.length === 0) return null;

	for (let step = 1; step <= n; step++) {
		if (n % step !== 0) continue;
		const offsets = Array.from({ length: n / step }, (_, i) => i * step);
		let ok = true;
		for (let d = 0; d < n && ok; d++) {
			// crew starting `o` days later is on pattern day (d - o)
			const onToday = offsets.map((o) => codeOn(d - o)).filter((c) => c !== "off");
			ok = working.every((w) => onToday.filter((c) => c === w).length === 1) && onToday.length === working.length;
		}
		if (ok) return { crews: offsets.length, offsets, fullCover: true };
	}
	return null;
}

/** "A", "B", "C" … for crew labels. */
export const crewLabel = (i: number) => String.fromCharCode(65 + i);
