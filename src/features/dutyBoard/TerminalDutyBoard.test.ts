import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({ api: { get: vi.fn() } }));
import {
	byTerminal,
	onlyDepartments,
	openSession,
	tally,
	worksAroundAirport,
} from "./TerminalDutyBoard";

const p = (id: string, checkedIn = false, isLate = false) => ({
	id,
	name: id,
	avatar: null,
	position: "officer",
	shiftStart: "",
	shiftEnd: "",
	checkedIn,
	checkedInAt: null,
	isLate,
});
const unit = (
	id: string,
	staff: ReturnType<typeof p>[],
	coverageStatus: "adequate" | "critical" = "adequate",
) => ({
	id,
	name: id,
	location: "",
	minStaff: 1,
	coverageStatus,
	onDutyStaff: staff,
});
const dept = (id: string, units: ReturnType<typeof unit>[]) => ({
	id,
	name: id,
	onDutyCount: 0,
	scheduledCount: 0,
	currentShift: "night",
	units,
});
const board = (departments: ReturnType<typeof dept>[]) => ({
	departments,
	contractors: [],
	lastUpdated: "",
	totalOnDuty: 0,
	totalScheduled: 0,
});

describe("tally: shifts that only just started", () => {
	const waiting = { ...p("w"), withinGrace: true };
	it("counts people inside their grace period as expected, not 'not arrived'", () => {
		const t = tally([dept("d", [unit("u", [p("a", true), waiting, p("x")])])]);
		expect(t.expected).toBe(1);
		expect(t.notArrived).toBe(1);
	});
	it("does not count an awaiting post as short", () => {
		const u = { ...unit("u", [waiting]), coverageStatus: "awaiting" as any };
		expect(tally([dept("d", [u])]).short).toBe(0);
		const c = unit("c", [p("x")], "critical");
		expect(tally([dept("d", [c])]).short).toBe(1);
	});
});

describe("byTerminal", () => {
	const all = board([
		dept("avsec", [unit("scr", [p("a", true), p("b")]), unit("pat", [p("c")])]),
		dept("env", [unit("wild", [p("w", true)])]),
	]);
	const tdt = board([dept("avsec", [unit("scr", [p("a", true)])])]);
	const it2 = board([
		dept("avsec", [unit("scr", [p("b")])]),
		dept("env", [unit("wild", [p("w", true)])]),
	]);
	const groups = byTerminal(all, [
		{ code: "TDT", name: "TDT", board: tdt },
		{ code: "IT2", name: "IT2", board: it2 },
	]);
	it("keeps each terminal's people and puts the rest under Around the airport", () => {
		expect(groups.map((g) => g.code)).toEqual(["TDT", "IT2", "OTHER"]);
		const other = groups[2];
		expect(other.name).toBe("Around the airport");
		expect(
			other.departments.flatMap((d) =>
				d.units.flatMap((u) => u.onDutyStaff.map((s) => s.id)),
			),
		).toEqual(["c"]);
	});
	it("limits a head to their department or unit across terminals", () => {
		const env = onlyDepartments(groups, ["env", "wild"]);
		expect(env.map((g) => g.departments.length)).toEqual([0, 1, 0]);
		const scr = onlyDepartments(groups, ["scr"]);
		expect(scr[0].departments[0].units.map((u) => u.id)).toEqual(["scr"]);
	});
});

describe("tally", () => {
	it("counts on post, late, not arrived and short posts", () => {
		expect(
			tally([
				dept("d", [
					unit("u", [p("a", true, true), p("b", true), p("c")], "critical"),
				]),
			]),
		).toEqual({ rostered: 3, onPost: 2, late: 1, notArrived: 1, expected: 0, short: 1 });
	});
});

describe("openSession", () => {
	it("reads the terminal from the last clock-in", () => {
		const logs = [
			{
				eventType: "manual_in",
				createdAt: "2026-11-15T18:32:15Z",
				zoneName: "Temporary Departure Terminal (TDT)",
			},
			{
				eventType: "manual_out",
				createdAt: "2026-11-15T18:32:16Z",
				zoneName: "Temporary Departure Terminal (TDT)",
			},
			{
				eventType: "geofence_in",
				createdAt: "2026-11-15T18:40:00Z",
				zoneName: "International Terminal II (IT2)",
			},
		];
		expect(openSession(logs)).toEqual([
			{ terminalCode: "IT2", startedAt: "2026-11-15T18:40:00Z", endedAt: null },
		]);
	});
	it("is empty after clocking out", () => {
		expect(
			openSession([
				{ eventType: "manual_in", createdAt: "1", zoneName: "X (IT2)" },
				{ eventType: "manual_out", createdAt: "2", zoneName: "X (IT2)" },
			]),
		).toEqual([]);
	});
});

describe("worksAroundAirport", () => {
	it("is true for a unit that covers every terminal", () => {
		expect(
			worksAroundAirport(
				{ terminalCodes: '["TDT","HAJJ","IT2","GAT","PRES","MMA2"]' },
				6,
			),
		).toBe(true);
		expect(worksAroundAirport({ terminalCodes: '["IT2"]' }, 6)).toBe(false);
		expect(worksAroundAirport(undefined, 6)).toBe(false);
	});
});
