import { describe, expect, it } from "vitest";
import {
	isRetryable,
	OFFLINE_CHECKINS_KEY,
	OFFLINE_MAX_AGE_MS,
	offlineNote,
	pendingCheckIns,
	queueCheckIn,
	removeQueuedCheckIn,
} from "./offlineCheckIn";

const memory = () => {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
	};
};

const base = { lat: 6.576, lng: 3.324, terminalCode: "TDT", deviceId: "d1" };

describe("offline check-in queue", () => {
	const t0 = "2026-11-20T05:58:00.000Z";
	const now = Date.parse("2026-11-20T06:30:00.000Z");

	it("keeps the time the button was pressed", () => {
		const s = memory();
		queueCheckIn({ ...base, userId: "u1", capturedAt: t0 }, s);
		const [q] = pendingCheckIns("u1", now, s);
		expect(q.capturedAt).toBe(t0);
		expect(q.terminalCode).toBe("TDT");
	});

	it("keeps only the first press per person", () => {
		const s = memory();
		queueCheckIn({ ...base, userId: "u1", capturedAt: t0 }, s);
		queueCheckIn(
			{ ...base, userId: "u1", capturedAt: "2026-11-20T06:05:00.000Z" },
			s,
		);
		expect(pendingCheckIns("u1", now, s)).toHaveLength(1);
		expect(pendingCheckIns("u1", now, s)[0].capturedAt).toBe(t0);
	});

	it("never sends someone else's check-in from a shared phone", () => {
		const s = memory();
		queueCheckIn({ ...base, userId: "u1", capturedAt: t0 }, s);
		expect(pendingCheckIns("u2", now, s)).toEqual([]);
		expect(pendingCheckIns(undefined, now, s)).toEqual([]);
	});

	it("drops a check-in too old to belong to this shift", () => {
		const s = memory();
		queueCheckIn({ ...base, userId: "u1", capturedAt: t0 }, s);
		expect(
			pendingCheckIns("u1", Date.parse(t0) + OFFLINE_MAX_AGE_MS + 1, s),
		).toEqual([]);
	});

	it("removes a check-in once sent", () => {
		const s = memory();
		const q = queueCheckIn({ ...base, userId: "u1", capturedAt: t0 }, s);
		removeQueuedCheckIn(q.id, s);
		expect(pendingCheckIns("u1", now, s)).toEqual([]);
	});

	it("survives damaged storage", () => {
		const s = memory();
		s.setItem(OFFLINE_CHECKINS_KEY, "{broken");
		expect(pendingCheckIns("u1", now, s)).toEqual([]);
		expect(() =>
			queueCheckIn({ ...base, userId: "u1", capturedAt: t0 }, s),
		).not.toThrow();
	});

	it("records the original time in the note", () => {
		const note = offlineNote(t0, new Date(now));
		expect(note).toContain(t0);
		expect(note).toMatch(/offline at \d\d:\d\d/);
	});

	it("retries when offline or the server failed, not when refused", () => {
		expect(isRetryable({ status: 0 })).toBe(true);
		expect(isRetryable({ status: 503 })).toBe(true);
		expect(isRetryable(new Error("network"))).toBe(true);
		expect(isRetryable({ status: 403 })).toBe(false);
		expect(isRetryable({ status: 409 })).toBe(false);
	});
});
