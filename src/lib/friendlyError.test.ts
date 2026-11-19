import { describe, expect, it } from "vitest";
import {
	fieldLabel,
	LOAD_FAILED,
	plainMessage,
	validationMessage,
} from "./friendlyError";

describe("friendlyError", () => {
	it("turns field names into labels", () => {
		expect(fieldLabel("toUserId")).toBe("To user");
		expect(fieldLabel("items.0.due_date")).toBe("Due date");
	});
	it("names the first field to fix and counts the rest", () => {
		expect(validationMessage({ toUserId: ["Required"] })).toBe(
			"Check “To user”: this is required.",
		);
		expect(
			validationMessage({ email: ["Invalid email"], phone: ["Required"] }),
		).toBe("Check “Email”: enter a valid email address. 1 more to check.");
		expect(validationMessage({ toUserId: ["Invalid uuid"] })).toContain(
			"pick one from the list",
		);
	});
	it("replaces 'Validation failed' with a next step", () => {
		expect(plainMessage(400, "Validation failed")).toMatch(/check the form/i);
		expect(
			plainMessage(400, "Validation failed", { title: ["Required"] }),
		).toBe("Check “Title”: this is required.");
	});
	it("explains an invalid assignment chain", () => {
		const a = plainMessage(400, "Invalid assignment chain");
		const b = plainMessage(
			400,
			"Invalid assignment chain: the recipient does not report to you in the position hierarchy",
		);
		for (const m of [a, b]) expect(m).toMatch(/reports to you/i);
	});
	it("leaves already-helpful server reasons alone", () => {
		expect(plainMessage(409, "This leave overlaps an approved one.")).toBe(
			"This leave overlaps an approved one.",
		);
	});
	it("handles empty messages by status", () => {
		expect(plainMessage(500, "")).toMatch(/our side/);
		expect(plainMessage(403, "")).toMatch(/permission/);
	});
	it("never says 'check the form' for a page that is only being read", () => {
		expect(plainMessage(400, "Validation failed", undefined, "get")).toBe(
			LOAD_FAILED,
		);
		expect(plainMessage(400, "Validation failed", { id: ["Invalid uuid"] }, "GET")).toBe(
			LOAD_FAILED,
		);
		// a form submit still names the field
		expect(
			plainMessage(400, "Validation failed", { title: ["Required"] }, "post"),
		).toBe("Check “Title”: this is required.");
	});
	it("explains a missing server route", () => {
		expect(plainMessage(404, "Route not found")).toMatch(/isn't available/);
	});
});
