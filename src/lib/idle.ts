/**
 * Sign-out after a period without activity. The last activity time is kept in localStorage so
 * every open tab shares it: working in one tab keeps the others signed in, and a tab reopened
 * after the limit signs out at once.
 */

/** 30 minutes, as the MMIA test pack requires. */
export const IDLE_LIMIT_MS = 30 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "nams_last_activity";
export const IDLE_SIGNED_OUT_MESSAGE =
	"You were signed out after 30 minutes without activity. Sign in again to carry on.";

/** Paths where nobody is expected to touch the screen (wall displays). */
const NEVER_IDLE = ["/public/"];

export function idleApplies(path: string): boolean {
	return !NEVER_IDLE.some((p) => path.startsWith(p));
}

/** Whether the limit has passed. A missing or unreadable time counts as active now. */
export function isIdle(
	lastActivity: number | null | undefined,
	now: number,
	limit = IDLE_LIMIT_MS,
): boolean {
	if (!lastActivity || !Number.isFinite(lastActivity)) return false;
	return now - lastActivity >= limit;
}

export function readLastActivity(
	storage: Pick<Storage, "getItem">,
): number | null {
	try {
		const raw = storage.getItem(LAST_ACTIVITY_KEY);
		const n = raw ? Number(raw) : Number.NaN;
		return Number.isFinite(n) ? n : null;
	} catch {
		return null;
	}
}

export function writeLastActivity(
	storage: Pick<Storage, "setItem">,
	at: number,
): void {
	try {
		storage.setItem(LAST_ACTIVITY_KEY, String(at));
	} catch {
		// Private mode or blocked storage: the in-memory timer still works for this tab.
	}
}

/** Where to send someone after an idle sign-out. */
export function signInPathFor(path: string, isPortalUser: boolean): string {
	return isPortalUser ||
		path === "/stakeholder" ||
		path.startsWith("/stakeholder/")
		? "/stakeholder/login"
		: "/auth/login";
}
