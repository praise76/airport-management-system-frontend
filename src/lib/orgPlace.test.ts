import { describe, expect, it } from "vitest";
import { orgPlace, unitAndStation } from "./orgPlace";

const deps = [
	{ id: "av", name: "Aviation Security (AVSEC)", parentDepartmentId: null },
	{ id: "scr", name: "Passenger Screening", parentDepartmentId: "av" },
	{ id: "tdt", name: "TDT Departure Screening", parentDepartmentId: "scr" },
	{
		id: "hr",
		name: "Human Resources & Administration",
		parentDepartmentId: null,
	},
];

describe("orgPlace", () => {
	it("names the top-level department for someone at a station", () => {
		const p = orgPlace("tdt", deps);
		expect(p).toEqual({
			department: "Aviation Security (AVSEC)",
			unit: "Passenger Screening",
			station: "TDT Departure Screening",
		});
		expect(unitAndStation(p)).toBe(
			"Passenger Screening · TDT Departure Screening",
		);
	});
	it("names the department and unit for someone in a unit", () => {
		expect(orgPlace("scr", deps)).toEqual({
			department: "Aviation Security (AVSEC)",
			unit: "Passenger Screening",
			station: undefined,
		});
	});
	it("has no unit or station for someone at department level", () => {
		const p = orgPlace("hr", deps);
		expect(p.department).toBe("Human Resources & Administration");
		expect(unitAndStation(p)).toBe("");
	});
	it("is empty when the department is unknown or not loaded", () => {
		expect(orgPlace("x", deps)).toEqual({});
		expect(orgPlace("tdt", undefined)).toEqual({});
	});
});
