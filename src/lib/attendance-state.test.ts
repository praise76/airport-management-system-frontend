import { describe, expect, it } from "vitest";
import { getDailyAttendanceState } from "./attendance-state";

describe("getDailyAttendanceState", () => {
	it("uses an active session as the authoritative checked-in state", () => {
		const state = getDailyAttendanceState({
			date: "2026-11-06",
			activeSession: {
				id: "session-2",
				startedAt: "2026-11-06T12:00:00.000Z",
				zoneName: "Terminal 1",
			},
			logs: [
				{
					id: "log-1",
					eventType: "manual_out",
					createdAt: "2026-11-06T10:00:00.000Z",
				},
			],
		});

		expect(state.checkedIn).toBe(true);
		expect(state.checkedOut).toBe(false);
		expect(state.checkInTime).toBe("2026-11-06T12:00:00.000Z");
	});

	it("recognises the latest checkout when there is no active session", () => {
		const state = getDailyAttendanceState({
			date: "2026-11-06",
			activeSession: null,
			logs: [
				{
					id: "log-1",
					eventType: "manual_in",
					createdAt: "2026-11-06T08:00:00.000Z",
				},
				{
					id: "log-2",
					eventType: "manual_out",
					createdAt: "2026-11-06T10:00:00.000Z",
				},
			],
		});

		expect(state.checkedIn).toBe(false);
		expect(state.checkedOut).toBe(true);
		expect(state.checkOutTime).toBe("2026-11-06T10:00:00.000Z");
	});
});
