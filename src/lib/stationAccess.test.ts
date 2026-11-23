import { describe, expect, it } from "vitest";
import { stationsFor } from "./stationAccess";

const D = [
	{
		id: "env",
		name: "Environmental Services",
		parentDepartmentId: null,
		departmentLevel: 1,
	},
	{
		id: "grass",
		name: "Grass Management",
		parentDepartmentId: "env",
		departmentLevel: 2,
	},
	{
		id: "wild",
		name: "Wildlife and Bird Control",
		parentDepartmentId: "env",
		departmentLevel: 2,
	},
	{
		id: "g-air",
		name: "Grass Management, airport-wide",
		parentDepartmentId: "grass",
		departmentLevel: 3,
		headUserId: "victor",
	},
	{
		id: "w-air",
		name: "Wildlife and Bird Control, airport-wide",
		parentDepartmentId: "wild",
		departmentLevel: 3,
	},
	{
		id: "g-old",
		name: "Grass Management, TDT",
		parentDepartmentId: "grass",
		departmentLevel: 3,
		archivedAt: "2026-11-23",
	},
	{
		id: "av",
		name: "Aviation Security (AVSEC)",
		parentDepartmentId: null,
		departmentLevel: 1,
	},
	{
		id: "scr",
		name: "Passenger Screening",
		parentDepartmentId: "av",
		departmentLevel: 2,
	},
	{
		id: "tdt",
		name: "TDT Departure Screening",
		parentDepartmentId: "scr",
		departmentLevel: 3,
	},
	{
		id: "it2",
		name: "IT2 D Wing Screening",
		parentDepartmentId: "scr",
		departmentLevel: 3,
	},
	{
		id: "acc",
		name: "Access Control",
		parentDepartmentId: "av",
		departmentLevel: 2,
	},
	{
		id: "gate",
		name: "TDT Airside Access Gate",
		parentDepartmentId: "acc",
		departmentLevel: 3,
	},
];
const names = (l: { name: string }[]) => l.map((s) => s.name).sort();

describe("stationsFor", () => {
	it("gives a unit officer only their own unit's live stations", () => {
		const s = stationsFor(
			{ id: "bello", departmentId: "grass", roles: ["OFFICER"] },
			D,
		);
		expect(names(s.mine)).toEqual(["Grass Management, airport-wide"]);
		expect(s.all).toBe(false);
	});
	it("gives a station officer every station of their unit (TDT and IT2 together)", () => {
		const s = stationsFor(
			{ id: "b", departmentId: "tdt", roles: ["SUPERVISOR"] },
			D,
		);
		expect(names(s.mine)).toEqual([
			"IT2 D Wing Screening",
			"TDT Departure Screening",
		]);
	});
	it("gives department-level staff their department's stations", () => {
		expect(
			names(stationsFor({ id: "x", departmentId: "env" }, D).mine),
		).toEqual([
			"Grass Management, airport-wide",
			"Wildlife and Bird Control, airport-wide",
		]);
	});
	it("adds a post the roster sends them to cover today, by its name", () => {
		const s = stationsFor({ id: "b", departmentId: "tdt" }, D, [
			"TDT Airside Access Gate",
		]);
		expect(names(s.covering)).toEqual(["TDT Airside Access Gate"]);
		expect(names(s.mine)).not.toContain("TDT Airside Access Gate");
	});
	it("includes a station the person heads", () => {
		expect(
			names(stationsFor({ id: "victor", departmentId: "env" }, D).mine),
		).toContain("Grass Management, airport-wide");
		expect(
			names(stationsFor({ id: "victor", departmentId: "av" }, D).mine),
		).toContain("Grass Management, airport-wide");
	});
	it("shows every live station to airport-wide roles", () => {
		const s = stationsFor({ id: "r", departmentId: "x", roles: ["RGM"] }, D);
		expect(s.all).toBe(true);
		expect(s.mine).toHaveLength(5); // the archived Grass TDT station is left out
	});
	it("shows nothing when the person has no department", () => {
		expect(stationsFor({ id: "n" }, D).mine).toEqual([]);
	});
});
