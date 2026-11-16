import { describe, expect, it } from "vitest";
import { attendanceScope } from "./attendanceScope";

const deps = [
	{ id: "env", name: "Environmental Services", parentDepartmentId: null },
	{ id: "fm", name: "Facility Maintenance", parentDepartmentId: "env" },
	{ id: "gm", name: "Grass Management", parentDepartmentId: "env" },
	{ id: "avsec", name: "Aviation Security", parentDepartmentId: null },
	{ id: "scr", name: "Passenger Screening", parentDepartmentId: "avsec" },
];

describe("attendanceScope", () => {
	it("shows HR, the GM and the RGM everyone", () => {
		for (const role of ["hr", "gm", "rgm", "super_admin"]) expect(attendanceScope({ role, departmentId: "fm" }, deps).kind).toBe("all");
	});
	it("shows a Department Head their department and its units", () => {
		const s = attendanceScope({ role: "hod", departmentId: "env" }, deps);
		expect(s).toEqual({ kind: "departments", ids: ["env", "fm", "gm"], label: "Environmental Services and its 2 units" });
	});
	it("shows a Unit Head or a supervisor only their own unit", () => {
		expect(attendanceScope({ role: "manager", departmentId: "fm" }, deps)).toMatchObject({ kind: "departments", ids: ["fm"] });
		expect(attendanceScope({ role: "supervisor", departmentId: "scr" }, deps)).toMatchObject({ kind: "departments", ids: ["scr"] });
	});
	it("refuses ordinary staff and officers", () => {
		expect(attendanceScope({ role: "staff", departmentId: "fm" }, deps).kind).toBe("none");
		expect(attendanceScope({ role: "officer", departmentId: "scr" }, deps).kind).toBe("none");
	});
	it("gives an officer who runs a terminal that terminal, and nothing else", () => {
		expect(attendanceScope({ role: "officer", departmentId: "scr" }, deps, "IT2")).toMatchObject({ kind: "terminal", code: "IT2" });
		expect(attendanceScope({ role: "officer", departmentId: "scr" }, deps, null).kind).toBe("none");
	});
	it("leaves heads and org-wide roles as they were, even when they run a terminal", () => {
		expect(attendanceScope({ role: "hr", departmentId: "fm" }, deps, "IT2").kind).toBe("all");
		expect(attendanceScope({ role: "hod", departmentId: "env" }, deps, "IT2").kind).toBe("departments");
	});
});
