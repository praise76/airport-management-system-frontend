import { describe, expect, it } from "vitest";
import type { Member, MessageAcknowledgment } from "@/types/messaging";
import {
	canSendAlert,
	hasAcknowledged,
	summarizeAcknowledgments,
} from "./acknowledgments";

const member = (userId: string, firstName: string): Member => ({
	userId,
	role: "member",
	firstName,
	lastName: "Test",
});
const ack = (
	userId: string,
	firstName: string,
	at: string,
): MessageAcknowledgment => ({
	id: `ack-${userId}`,
	userId,
	acknowledgedAt: at,
	firstName,
	lastName: "Test",
});

describe("acknowledgments", () => {
	const members = [
		member("hod", "Hod"),
		member("pc", "Pc"),
		member("bag", "Bag"),
		member("pat", "Pat"),
	];

	it("counts two acknowledged and one pending, leaving the sender out", () => {
		const s = summarizeAcknowledgments(
			"hod",
			[
				ack("bag", "Bag", "2026-11-20T06:28:00Z"),
				ack("pc", "Pc", "2026-11-20T06:27:00Z"),
			],
			members,
		);
		expect(s.expected).toBe(3);
		expect(s.acknowledged.map((p) => p.userId)).toEqual(["pc", "bag"]);
		expect(s.pending.map((p) => p.name)).toEqual(["Pat Test"]);
	});

	it("ignores a duplicate and the sender's own acknowledgment", () => {
		const s = summarizeAcknowledgments(
			"hod",
			[
				ack("pc", "Pc", "2026-11-20T06:27:00Z"),
				ack("pc", "Pc", "2026-11-20T06:29:00Z"),
				ack("hod", "Hod", "2026-11-20T06:30:00Z"),
			],
			members,
		);
		expect(s.acknowledged).toHaveLength(1);
		expect(s.pending).toHaveLength(2);
	});

	it("works without the member list", () => {
		const s = summarizeAcknowledgments("hod", [
			ack("pc", "Pc", "2026-11-20T06:27:00Z"),
		]);
		expect(s.expected).toBe(1);
		expect(s.pending).toEqual([]);
	});

	it("knows whether someone has acknowledged", () => {
		const acks = [ack("pc", "Pc", "2026-11-20T06:27:00Z")];
		expect(hasAcknowledged("pc", acks)).toBe(true);
		expect(hasAcknowledged("pat", acks)).toBe(false);
		expect(hasAcknowledged(undefined, acks)).toBe(false);
	});

	it("lets supervisors and above send alerts, not officers", () => {
		expect(canSendAlert({ role: "acos" })).toBe(true);
		expect(canSendAlert({ role: "supervisor" })).toBe(true);
		expect(canSendAlert({ role: "hod" })).toBe(true);
		expect(canSendAlert({ role: "officer" })).toBe(false);
		expect(canSendAlert({ role: "staff" })).toBe(false);
		expect(canSendAlert(null)).toBe(false);
	});
});
