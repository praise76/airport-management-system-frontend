import { describe, expect, it } from "vitest";
import {
	clearDraft,
	DRAFT_MAX_AGE_MS,
	draftKey,
	loadDraft,
	saveDraft,
} from "./formDraft";

const memory = () => {
	const m = new Map<string, string>();
	return {
		getItem: (k: string) => m.get(k) ?? null,
		setItem: (k: string, v: string) => void m.set(k, v),
		removeItem: (k: string) => void m.delete(k),
		size: () => m.size,
	};
};

describe("form drafts", () => {
	const now = Date.parse("2026-11-20T10:00:00Z");
	const key = draftKey("permit", "org-a");

	it("keeps a draft per form and company", () => {
		expect(draftKey("permit", "org-a")).not.toBe(draftKey("permit", "org-b"));
		expect(draftKey("permit", "")).toContain("anon");
	});

	it("saves and restores what was typed", () => {
		const s = memory();
		const draft = { people: [{ personName: "Ada" }], permitType: "visitor" };
		saveDraft(key, draft, now, s);
		expect(loadDraft(key, now + 1000, s)).toEqual(draft);
	});

	it("drops a draft older than 7 days", () => {
		const s = memory();
		saveDraft(key, { a: 1 }, now, s);
		expect(loadDraft(key, now + DRAFT_MAX_AGE_MS + 1, s)).toBeNull();
		expect(s.size()).toBe(0);
	});

	it("clears a draft after the form is sent", () => {
		const s = memory();
		saveDraft(key, { a: 1 }, now, s);
		clearDraft(key, s);
		expect(loadDraft(key, now, s)).toBeNull();
	});

	it("ignores broken or foreign data, and missing storage", () => {
		const s = memory();
		s.setItem(key, "not json");
		expect(loadDraft(key, now, s)).toBeNull();
		s.setItem(key, JSON.stringify({ something: "else" }));
		expect(loadDraft(key, now, s)).toBeNull();
		expect(loadDraft(key, now, null)).toBeNull();
		expect(() => saveDraft(key, {}, now, null)).not.toThrow();
	});
});
