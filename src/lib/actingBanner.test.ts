import { describe, expect, it } from "vitest";
import { actingBannerText } from "./actingBanner";

describe("acting banner", () => {
	it("names the role being covered, not the person's own role", () => {
		expect(actingBannerText().title).toBe("You are acting Head of Department");
	});
	it("says until when", () => {
		expect(actingBannerText("2026-11-25T00:00:00.000Z").detail).toMatch(
			/until the end of 2[45] Nov 2026/,
		);
	});
	it("leaves the date out when it is missing or unreadable", () => {
		expect(actingBannerText(null).detail).not.toMatch(/until/);
		expect(actingBannerText("not a date").detail).not.toMatch(/until/);
	});
});
