import { describe, expect, it } from "vitest";
import { annualLeaveDaysForGrade, gradeLabel, isValidGrade } from "./leavePolicy";

describe("grade-based annual leave", () => {
	it("gives 21 working days for grades 1-7", () => {
		for (const g of [1, 4, 7]) expect(annualLeaveDaysForGrade(g)).toBe(21);
	});
	it("gives 30 working days for grades 8-15", () => {
		for (const g of [8, 12, 15]) expect(annualLeaveDaysForGrade(g)).toBe(30);
	});
	it("returns null when the grade is missing or out of range", () => {
		for (const g of [undefined, null, 0, 16, 7.5, "abc"]) expect(annualLeaveDaysForGrade(g)).toBeNull();
		expect(annualLeaveDaysForGrade("8")).toBe(30);
	});
	it("labels grades", () => {
		expect(isValidGrade(15)).toBe(true);
		expect(isValidGrade(16)).toBe(false);
		expect(gradeLabel(8)).toBe("Grade 8");
		expect(gradeLabel(undefined)).toBe("Not set");
	});
});
