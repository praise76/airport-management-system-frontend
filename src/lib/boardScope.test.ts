import { describe, expect, it } from "vitest";
import { boardScope, todaysTerminal } from "./boardScope";

const depts = [
	{ id: "env", name: "Environmental Services" },
	{ id: "fm", name: "Facility Maintenance", parentDepartmentId: "env" },
	{ id: "avsec", name: "Aviation Security" },
];
const T = [
	{ id: "t1", terminalCode: "TDT" },
	{ id: "t2", terminalCode: "IT2" },
];

describe("boardScope", () => {
	it("gives the RGM, GM and HR every terminal", () => {
		for (const role of ["rgm", "gm", "hr", "super_admin"])
			expect(boardScope({ role }, depts, null).kind).toBe("all");
	});
	it("gives a HOD their department and its units across terminals", () => {
		const s = boardScope({ role: "hod", departmentId: "env" }, depts, "TDT");
		expect(s).toMatchObject({ kind: "departments", ids: ["env", "fm"] });
	});
	it("gives a Head of Unit their unit", () => {
		expect(
			boardScope({ role: "hou", departmentId: "fm" }, depts, null),
		).toMatchObject({ kind: "departments", ids: ["fm"] });
	});
	it("gives officers and supervisors only their terminal", () => {
		expect(
			boardScope(
				{ role: "officer", departmentId: "fm" },
				depts,
				"TDT",
				"Temporary Departure Terminal",
			),
		).toEqual({
			kind: "terminal",
			code: "TDT",
			label: "Temporary Departure Terminal",
		});
		expect(boardScope({ role: "supervisor" }, depts, "IT2").kind).toBe(
			"terminal",
		);
	});
	it("lets junior staff of a unit that works around the airport see every terminal", () => {
		expect(
			boardScope(
				{ role: "officer", departmentId: "fm" },
				depts,
				"IT2",
				"IT2",
				true,
			).kind,
		).toBe("airport");
		expect(
			boardScope({ role: "officer" }, depts, null, undefined, true).kind,
		).toBe("airport");
	});
	it("asks junior staff with no terminal today to clock in", () => {
		expect(boardScope({ role: "officer" }, depts, null).kind).toBe("none");
	});
});

describe("todaysTerminal", () => {
	const now = new Date(2026, 10, 16, 2, 30); // 02:30 on 16 Nov
	it("prefers the open clock-in", () => {
		expect(
			todaysTerminal(
				[
					{
						terminalCode: "IT2",
						startedAt: "2026-11-15T21:00:00Z",
						endedAt: null,
					},
				],
				[{ dutyDate: "2026-11-16", terminalId: "t1" }],
				T,
				now,
			),
		).toBe("IT2");
	});
	it("uses last night's shift while it is still running", () => {
		expect(
			todaysTerminal(
				[],
				[
					{
						dutyDate: "2026-11-15",
						shiftStartTime: "22:00",
						shiftEndTime: "06:00",
						terminalId: "t1",
					},
				],
				T,
				now,
			),
		).toBe("TDT");
	});
	it("falls back to a later shift today, or nothing", () => {
		expect(
			todaysTerminal(
				[],
				[
					{
						dutyDate: "2026-11-16",
						shiftStartTime: "14:00",
						shiftEndTime: "22:00",
						terminalId: "t2",
					},
				],
				T,
				now,
			),
		).toBe("IT2");
		expect(
			todaysTerminal(
				[{ terminalCode: "TDT", endedAt: "2026-11-15T10:00:00Z" }],
				[],
				T,
				now,
			),
		).toBeNull();
	});
});
