import type {
	AttendanceLog,
	AttendanceRecord,
	DailyAttendance,
} from "@/types/attendance";

const CHECK_IN_EVENTS = new Set(["auto_in", "manual_in"]);
const CHECK_OUT_EVENTS = new Set(["auto_out", "manual_out"]);

export function isCheckInEvent(eventType?: string): boolean {
	return eventType ? CHECK_IN_EVENTS.has(eventType) : false;
}

export function isCheckOutEvent(eventType?: string): boolean {
	return eventType ? CHECK_OUT_EVENTS.has(eventType) : false;
}

function lastMatchingLog(
	logs: AttendanceLog[],
	predicate: (eventType?: string) => boolean,
): AttendanceLog | undefined {
	return [...logs].reverse().find((log) => predicate(log.eventType));
}

/** Derive the screen state from the fields the live endpoint actually returns. */
export function getDailyAttendanceState(attendance?: DailyAttendance) {
	const logs = attendance?.logs ?? [];
	const latestLog = logs.at(-1);
	const latestCheckIn = lastMatchingLog(logs, isCheckInEvent);
	const latestCheckOut = lastMatchingLog(logs, isCheckOutEvent);
	const checkedIn = Boolean(attendance?.activeSession);
	const checkedOut = !checkedIn && isCheckOutEvent(latestLog?.eventType);

	return {
		checkedIn,
		checkedOut,
		checkInTime:
			attendance?.activeSession?.startedAt ?? latestCheckIn?.createdAt,
		checkInZone: attendance?.activeSession?.zoneName ?? latestCheckIn?.zoneName,
		checkOutTime: latestCheckOut?.createdAt,
		checkOutZone: latestCheckOut?.zoneName,
	};
}

export function getAttendanceEventDisplay(record: AttendanceRecord) {
	if (isCheckInEvent(record.eventType)) {
		return { label: "Checked in", status: "CHECKED_IN" as const };
	}
	if (isCheckOutEvent(record.eventType)) {
		return { label: "Checked out", status: "CHECKED_OUT" as const };
	}
	return { label: "Attendance event", status: record.status };
}
