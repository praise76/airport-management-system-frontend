/**
 * Check-ins pressed while the phone has no connection. They are kept on the phone with the time
 * the button was pressed and sent when the connection returns (MMIA test pack 31).
 *
 * The server has no field for the original time yet, so the time is sent in `notes` as well; the
 * developer brief asks for a `capturedAt` field that the server should record as the check-in time.
 */

export const OFFLINE_CHECKINS_KEY = "nams_offline_checkins";
/** Older than this, a queued check-in is no longer worth sending: it would be for another shift. */
export const OFFLINE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export type QueuedCheckIn = {
	id: string;
	userId: string;
	lat: number;
	lng: number;
	terminalCode?: string;
	deviceId?: string;
	/** ISO time the person pressed Check in. */
	capturedAt: string;
};

type QueueStorage = Pick<Storage, "getItem" | "setItem">;

const store = (): QueueStorage | null => {
	try {
		return typeof localStorage !== "undefined" ? localStorage : null;
	} catch {
		return null;
	}
};

function readAll(storage: QueueStorage | null): QueuedCheckIn[] {
	if (!storage) return [];
	try {
		const list = JSON.parse(storage.getItem(OFFLINE_CHECKINS_KEY) ?? "[]");
		return Array.isArray(list) ? (list as QueuedCheckIn[]) : [];
	} catch {
		return [];
	}
}

function writeAll(storage: QueueStorage | null, list: QueuedCheckIn[]): void {
	try {
		storage?.setItem(OFFLINE_CHECKINS_KEY, JSON.stringify(list));
	} catch {
		// ignore: storage blocked or full
	}
}

/** This person's queued check-ins still worth sending, oldest first. */
export function pendingCheckIns(
	userId: string | undefined,
	now = Date.now(),
	storage: QueueStorage | null = store(),
): QueuedCheckIn[] {
	if (!userId) return [];
	return readAll(storage)
		.filter(
			(c) =>
				c.userId === userId &&
				now - Date.parse(c.capturedAt) <= OFFLINE_MAX_AGE_MS,
		)
		.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
}

/**
 * Keep a check-in for later. Only one per person is kept: pressing again while still offline
 * keeps the first press, which is the real arrival time.
 */
export function queueCheckIn(
	entry: Omit<QueuedCheckIn, "id">,
	storage: QueueStorage | null = store(),
): QueuedCheckIn {
	const list = readAll(storage);
	const existing = list.find((c) => c.userId === entry.userId);
	if (existing) return existing;
	const item: QueuedCheckIn = {
		...entry,
		id: `${entry.userId}-${Date.parse(entry.capturedAt)}`,
	};
	writeAll(storage, [...list, item]);
	return item;
}

export function removeQueuedCheckIn(
	id: string,
	storage: QueueStorage | null = store(),
): void {
	writeAll(
		storage,
		readAll(storage).filter((c) => c.id !== id),
	);
}

const hhmm = (d: Date) =>
	`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** The note sent with a queued check-in, so the original time is on record. */
export function offlineNote(capturedAt: string, sentAt: Date): string {
	const at = new Date(capturedAt);
	return `Checked in offline at ${hhmm(at)} (${capturedAt}); sent when back online at ${hhmm(sentAt)}.`;
}

/** Whether a failed send should be retried later (no connection) or given up (refused). */
export function isRetryable(error: unknown): boolean {
	const status = (error as { status?: number } | null)?.status;
	return status === undefined || status === 0 || status >= 500;
}
