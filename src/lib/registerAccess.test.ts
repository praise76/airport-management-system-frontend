import { describe, expect, it } from "vitest";
import { canRegisterIncoming } from "./registerAccess";

describe("canRegisterIncoming", () => {
	it("is for the RGM's office and administrators", () => {
		for (const role of ["rgm", "registry_clerk", "super_admin", "org_admin"]) {
			expect(canRegisterIncoming(role)).toBe(true);
		}
	});
	it("is not for heads of department or anyone else", () => {
		for (const role of ["hod", "hou", "manager", "supervisor", "officer", "staff", "hr", "auditor"]) {
			expect(canRegisterIncoming(role)).toBe(false);
		}
		expect(canRegisterIncoming(undefined)).toBe(false);
	});
});
