import { describe, expect, it } from "vitest";
import { dailyTotals, weekOf } from "./dailyTotals";

const days = ["2026-11-23", "2026-11-28"]; // Monday, Saturday
const rosters = [
	{
		unitDepartmentId: "scr",
		approvalStatus: "approved",
		entries: [
			{
				staffId: "a",
				dutyDate: "2026-11-23",
				shift: "morning",
				status: "scheduled",
			},
			{
				staffId: "b",
				dutyDate: "2026-11-23",
				shift: "night",
				status: "scheduled",
			},
			{
				staffId: "c",
				dutyDate: "2026-11-23",
				shift: "afternoon",
				status: "on_leave",
			},
			{
				staffId: "a",
				dutyDate: "2026-11-28",
				shift: "morning",
				status: "scheduled",
			},
		],
	},
	// the permanent Monday-to-Friday supervisor, on a different roster of the same unit
	{
		unitDepartmentId: "scr",
		approvalStatus: "approved",
		entries: [{ staffId: "p", dutyDate: "2026-11-23", shift: "morning" }],
	},
	{
		unitDepartmentId: "scr",
		approvalStatus: "draft",
		entries: [{ staffId: "z", dutyDate: "2026-11-23", shift: "day" }],
	},
];

describe("dailyTotals", () => {
	const t = dailyTotals(rosters, days).get("scr");
	it("adds rotating teams and permanent staff for the day", () => {
		expect(t?.get("2026-11-23")?.onDuty).toBe(3);
		expect(t?.get("2026-11-23")?.byShift.morning).toEqual(["a", "p"]);
	});
	it("counts leave apart and leaves drafts out", () => {
		expect(t?.get("2026-11-23")?.onLeave).toBe(1);
		expect(t?.get("2026-11-23")?.byShift.day).toBeUndefined();
	});
	it("shows the lower weekend total", () => {
		expect(t?.get("2026-11-28")?.onDuty).toBe(1);
	});
	it("counts a person once a day even on two shifts", () => {
		const two = dailyTotals(
			[
				{
					unitDepartmentId: "u",
					entries: [
						{ staffId: "x", dutyDate: "2026-11-23", shift: "morning" },
						{ staffId: "x", dutyDate: "2026-11-23", shift: "night" },
					],
				},
			],
			days,
		);
		expect(two.get("u")?.get("2026-11-23")?.onDuty).toBe(1);
	});
});

describe("weekOf", () => {
	it("runs Monday to Sunday", () => {
		expect(weekOf("2026-11-25")).toEqual([
			"2026-11-23",
			"2026-11-24",
			"2026-11-25",
			"2026-11-26",
			"2026-11-27",
			"2026-11-28",
			"2026-11-29",
		]);
		expect(weekOf("2026-11-29")[0]).toBe("2026-11-23");
	});
});
