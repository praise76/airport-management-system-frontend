/**
 * "Cover for today": a supervisor sends an officer to another post for one shift.
 * It is stored on the officer's own roster entry for that day: the post (dutyLocation) and
 * terminal change, and the position says what they normally do, so it can be undone.
 */
export const COVER_PREFIX = "Covering ";

export function coverPosition(
	station: string,
	usualPost?: string | null,
): string {
	return `${COVER_PREFIX}${station} today${usualPost ? ` (normally ${usualPost})` : ""}`;
}

/** The post someone normally works, read back from a cover position; null when not covering. */
export function usualPostOf(
	position?: string | null,
): string | null | undefined {
	if (!position?.startsWith(COVER_PREFIX)) return undefined;
	const m = position.match(/\(normally (.+)\)$/);
	return m ? m[1] : null;
}

export const isCovering = (position?: string | null) =>
	usualPostOf(position) !== undefined;

/** The first terminal code a station lists ("[\"TDT\"]" or ["TDT"]), if any. */
export function stationTerminal(terminalCodes: unknown): string | undefined {
	let list: unknown = terminalCodes;
	if (typeof list === "string") {
		try {
			list = JSON.parse(list);
		} catch {
			list = list ? [list] : [];
		}
	}
	return Array.isArray(list) && typeof list[0] === "string"
		? list[0]
		: undefined;
}
