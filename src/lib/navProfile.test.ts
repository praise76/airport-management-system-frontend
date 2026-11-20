import { describe, expect, it } from "vitest";
import { PRIMARY_NAV, profileOf, splitNav } from "./navProfile";

describe("profileOf", () => {
	it("picks the profile from the role, in any case", () => {
		expect(profileOf({ role: "super_admin" })).toBe("admin");
		expect(profileOf({ role: "rgm" })).toBe("executive");
		expect(profileOf({ role: "HOD" })).toBe("manager");
		expect(profileOf({ role: "hr" })).toBe("hr");
		expect(profileOf({ role: "officer" })).toBe("staff");
		expect(profileOf({ role: "hou" })).toBe("supervisor");
	});
	it("treats an officer who runs a terminal as a supervisor", () => {
		expect(profileOf({ role: "officer" }, true)).toBe("supervisor");
	});
	it("uses the highest of several roles", () => {
		expect(profileOf({ role: "officer", roles: ["officer", "hod"] })).toBe("manager");
	});
});

describe("short menus", () => {
	it("keep every profile to nine items or fewer, each starting at Today", () => {
		for (const [profile, list] of Object.entries(PRIMARY_NAV)) {
			expect(list.length, profile).toBeLessThanOrEqual(9);
			expect(list[0]).toBe("/");
		}
	});
	const groups = [
		{ label: "A", items: [{ to: "/" }, { to: "/messages" }, { to: "/admin/staff" }] },
		{ label: "B", items: [{ to: "/documents" }, { to: "/stations" }] },
	];
	it("shows only the items the person may open, and the rest under More, none lost", () => {
		const { primary, more } = splitNav(groups, "staff");
		const moreItems = more.flatMap((g) => g.items.map((i) => i.to));
		expect(primary.map((i) => i.to)).toEqual(["/", "/messages", "/documents"]);
		expect(moreItems.sort()).toEqual(["/admin/staff", "/stations"]);
		expect(primary.length + moreItems.length).toBe(5);
	});
	it("does not invent items the person may not open", () => {
		const { primary } = splitNav([{ label: "A", items: [{ to: "/" }] }], "admin");
		expect(primary.map((i) => i.to)).toEqual(["/"]);
	});
});
