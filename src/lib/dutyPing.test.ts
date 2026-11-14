import { describe, expect, it } from "vitest";
import { pingTargets } from "./dutyPing";

const person = (id: string, checkedIn: boolean) => ({
	id,
	name: id,
	avatar: null,
	position: "Officer",
	shiftStart: "06:00",
	shiftEnd: "18:00",
	checkedIn,
	checkedInAt: null,
	isLate: false,
});
const unit = (staff: ReturnType<typeof person>[]) => ({
	id: "u",
	name: "Passenger Screening",
	location: "D Wing",
	minStaff: 2,
	coverageStatus: "adequate" as const,
	onDutyStaff: staff,
});

describe("pingTargets", () => {
	it("pings the people checked in at the post", () => {
		const t = pingTargets(unit([person("a", true), person("b", false), person("c", true)]));
		expect(t.ids).toEqual(["a", "c"]);
		expect(t.who).toMatch(/checked in/);
	});
	it("falls back to everyone rostered when nobody has checked in", () => {
		const t = pingTargets(unit([person("a", false), person("b", false)]));
		expect(t.ids).toEqual(["a", "b"]);
		expect(t.who).toMatch(/rostered/);
	});
	it("has nobody to ping at an empty post", () => {
		expect(pingTargets(unit([])).ids).toEqual([]);
	});
});
