import { describe, expect, it } from "vitest";
import {
	coverProblems,
	datesBetween,
	planShifts,
	shiftTimes,
	suggestTeamStarts,
} from "./buildRoster";

const p222 = {
	cycleLengthDays: 6,
	shiftSequenceJson: [
		{ day: 1, shift: "day" },
		{ day: 2, shift: "day" },
		{ day: 3, shift: "night" },
		{ day: 4, shift: "night" },
		{ day: 5, shift: "off" },
		{ day: 6, shift: "off" },
	],
} as any;

describe("planShifts", () => {
	it("gives each team 2 days, 2 nights and 2 off over 6 days, with one team on each shift every day", () => {
		const starts = suggestTeamStarts(p222, "2026-11-14", 3);
		const teams = ["A", "B", "C"].map((n, i) => ({
			name: `Team ${n}`,
			startDate: starts[i],
			memberIds: [`u${n}`],
		}));
		const shifts = planShifts({
			pattern: p222,
			teams,
			from: "2026-11-14",
			to: "2026-11-19",
		});
		for (const t of teams) {
			const mine = shifts.filter((s) => s.shiftGroup === t.name);
			expect(mine.filter((s) => s.shift === "day")).toHaveLength(2);
			expect(mine.filter((s) => s.shift === "night")).toHaveLength(2);
		}
		for (const d of datesBetween("2026-11-14", "2026-11-19")) {
			expect(
				shifts.filter((s) => s.dutyDate === d && s.shift === "day"),
			).toHaveLength(1);
			expect(
				shifts.filter((s) => s.dutyDate === d && s.shift === "night"),
			).toHaveLength(1);
		}
		expect(shifts[0]).toMatchObject({
			staffId: "uA",
			dutyDate: "2026-11-14",
			shift: "day",
			shiftGroup: "Team A",
		});
	});

	it("puts every member of a team on the same shifts", () => {
		const shifts = planShifts({
			pattern: p222,
			teams: [
				{ name: "Team A", startDate: "2026-11-14", memberIds: ["a1", "a2"] },
			],
			from: "2026-11-14",
			to: "2026-11-14",
		});
		expect(shifts.map((s) => s.staffId)).toEqual(["a1", "a2"]);
	});

	it("leaves out days before a team starts", () => {
		expect(
			planShifts({
				pattern: p222,
				teams: [{ name: "Team A", startDate: "2026-11-20", memberIds: ["a"] }],
				from: "2026-11-14",
				to: "2026-11-19",
			}),
		).toEqual([]);
	});
});

describe("shiftTimes", () => {
	it("uses the unit's own shift times when it has them", () => {
		expect(
			shiftTimes("day", p222, [
				{ name: "Day", startTime: "06:00:00", endTime: "18:00:00" },
			]),
		).toEqual({ start: "06:00", end: "18:00" });
	});
	it("defaults to 12-hour nights on a 12-hour pattern and 8-hour shifts otherwise", () => {
		expect(shiftTimes("night", p222)).toEqual({ start: "19:00", end: "07:00" });
		expect(
			shiftTimes("night", {
				cycleLengthDays: 4,
				shiftSequenceJson: [{ day: 1, shift: "night" }],
			} as any),
		).toEqual({ start: "22:00", end: "06:00" });
		expect(shiftTimes("morning", p222)).toEqual({
			start: "06:00",
			end: "14:00",
		});
	});
});

describe("cover and shift lengths", () => {
	it("flags teams that all start on the same day", () => {
		const teams = ["A", "B", "C"].map((n) => ({
			name: n,
			startDate: "2026-11-30",
			memberIds: ["x"],
		}));
		const gaps = coverProblems(
			p222,
			planShifts({
				pattern: p222,
				teams,
				from: "2026-11-30",
				to: "2026-12-05",
			}),
			"2026-11-30",
			"2026-12-05",
		);
		expect(gaps.some((g) => g.teams === 0)).toBe(true);
		expect(gaps.some((g) => g.teams === 3)).toBe(true);
	});
	it("ignores the unit's 8-hour night on a 12-hour pattern", () => {
		expect(
			shiftTimes("night", p222, [
				{ name: "Night", startTime: "22:00", endTime: "06:00" },
			]),
		).toEqual({ start: "19:00", end: "07:00" });
		expect(
			shiftTimes("night", p222, [
				{ name: "Night", startTime: "18:00", endTime: "06:00" },
			]),
		).toEqual({ start: "18:00", end: "06:00" });
	});
});
