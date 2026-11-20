/**
 * Keep an unfinished form on this device, so a dropped connection, a reload or a closed tab on a
 * phone doesn't lose it. Drafts are per form and per company, and expire after 7 days.
 */

export const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const PREFIX = "nams_draft:";

type Stored<T> = { v: 1; savedAt: number; data: T };
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const defaultStorage = (): DraftStorage | null => {
	try {
		return typeof localStorage !== "undefined" ? localStorage : null;
	} catch {
		return null;
	}
};

export function draftKey(form: string, scope: string): string {
	return `${PREFIX}${form}:${scope || "anon"}`;
}

export function loadDraft<T>(
	key: string,
	now = Date.now(),
	storage: DraftStorage | null = defaultStorage(),
): T | null {
	if (!storage) return null;
	try {
		const raw = storage.getItem(key);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as Stored<T>;
		if (parsed?.v !== 1 || typeof parsed.savedAt !== "number") return null;
		if (now - parsed.savedAt > DRAFT_MAX_AGE_MS) {
			storage.removeItem(key);
			return null;
		}
		return parsed.data;
	} catch {
		return null;
	}
}

export function saveDraft<T>(
	key: string,
	data: T,
	now = Date.now(),
	storage: DraftStorage | null = defaultStorage(),
): void {
	if (!storage) return;
	try {
		const stored: Stored<T> = { v: 1, savedAt: now, data };
		storage.setItem(key, JSON.stringify(stored));
	} catch {
		// Storage full or blocked: the form still works, it just isn't kept.
	}
}

export function clearDraft(
	key: string,
	storage: DraftStorage | null = defaultStorage(),
): void {
	try {
		storage?.removeItem(key);
	} catch {
		// ignore
	}
}
