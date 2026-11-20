import { describe, expect, it } from "vitest";
import {
	IDLE_LIMIT_MS,
	idleApplies,
	isIdle,
	LAST_ACTIVITY_KEY,
	readLastActivity,
	signInPathFor,
	writeLastActivity,
} from "./idle";

const memoryStorage = () => {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
	};
};

describe("idle sign-out", () => {
	const now = Date.parse("2026-11-20T10:00:00Z");

	it("signs out at 30 minutes without activity, not before", () => {
		expect(IDLE_LIMIT_MS).toBe(30 * 60 * 1000);
		expect(isIdle(now - 29 * 60 * 1000, now)).toBe(false);
		expect(isIdle(now - 30 * 60 * 1000, now)).toBe(true);
		expect(isIdle(now - 2 * 60 * 60 * 1000, now)).toBe(true);
	});

	it("treats a missing time as active, so a first visit is never signed out", () => {
		expect(isIdle(null, now)).toBe(false);
		expect(isIdle(undefined, now)).toBe(false);
		expect(isIdle(Number.NaN, now)).toBe(false);
	});

	it("keeps the last activity in shared storage", () => {
		const s = memoryStorage();
		expect(readLastActivity(s)).toBeNull();
		writeLastActivity(s, now);
		expect(s.getItem(LAST_ACTIVITY_KEY)).toBe(String(now));
		expect(readLastActivity(s)).toBe(now);
		s.setItem(LAST_ACTIVITY_KEY, "garbage");
		expect(readLastActivity(s)).toBeNull();
	});

	it("survives storage that throws", () => {
		const broken = {
			getItem: () => {
				throw new Error("blocked");
			},
			setItem: () => {
				throw new Error("blocked");
			},
		};
		expect(readLastActivity(broken)).toBeNull();
		expect(() => writeLastActivity(broken, now)).not.toThrow();
	});

	it("never signs out a wall display", () => {
		expect(idleApplies("/public/duty-board")).toBe(false);
		expect(idleApplies("/documents")).toBe(true);
		expect(idleApplies("/stakeholder/permits")).toBe(true);
	});

	it("sends portal users to the portal sign-in and staff to the staff sign-in", () => {
		expect(signInPathFor("/stakeholder/permits", true)).toBe(
			"/stakeholder/login",
		);
		expect(signInPathFor("/stakeholder/permits", false)).toBe(
			"/stakeholder/login",
		);
		expect(signInPathFor("/documents", false)).toBe("/auth/login");
		expect(signInPathFor("/", true)).toBe("/stakeholder/login");
	});
});
