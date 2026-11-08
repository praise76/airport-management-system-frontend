import { describe, expect, it } from "vitest";
import { PATTERN_PRESETS, hoursPerWeek, planCrews } from "./patternPresets";

const preset = (key: string) => {
	const p = PATTERN_PRESETS.find((x) => x.key === key);
	if (!p) throw new Error(`missing preset ${key}`);
	return p;
};

describe("roster pattern presets", () => {
	it("12-hour 2-2-2 needs 3 crews starting 2 days apart, ~56 h/week", () => {
		const p = preset("twelve-hour-2-2-2");
		expect(p.shiftSequenceJson.map((s) => s.shift)).toEqual(["day", "day", "night", "night", "off", "off"]);
		expect(planCrews(p)).toEqual({ crews: 3, offsets: [0, 2, 4], fullCover: true });
		expect(hoursPerWeek(p)).toBe(56);
	});

	it("4-shift 2-2-2-2 needs 4 crews starting 2 days apart, 42 h/week", () => {
		for (const key of ["four-shift", "four-shift-forward"]) {
			const p = preset(key);
			expect(p.cycleLengthDays).toBe(8);
			expect(planCrews(p)).toEqual({ crews: 4, offsets: [0, 2, 4, 6], fullCover: true });
			expect(hoursPerWeek(p)).toBe(42);
		}
		expect(preset("four-shift").shiftSequenceJson.map((s) => s.shift)).toEqual([
			"afternoon", "afternoon", "morning", "morning", "night", "night", "off", "off",
		]);
	});

	it("permanent morning is 40 h/week and isn't a 24-hour cover pattern", () => {
		const p = preset("permanent-morning");
		expect(hoursPerWeek(p)).toBe(40);
		expect(planCrews(p)).toBeNull();
	});
});
