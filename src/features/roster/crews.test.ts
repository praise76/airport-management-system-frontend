import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({ api: {} }));
vi.mock("@/api/groups", () => ({}));
vi.mock("@/api/messaging", () => ({}));

import { addDays, crewShiftOn, crewsByShift, daysBetween, readCrewMeta, writeCrewDescription } from "./crews";
import { PATTERN_PRESETS } from "./patternPresets";

const twelve = { id: "p12", ...PATTERN_PRESETS.find((p) => p.key === "twelve-hour-2-2-2")! };

describe("crew dates", () => {
	it("counts whole days and adds days across month ends", () => {
		expect(daysBetween("2026-11-28", "2026-12-02")).toBe(4);
		expect(addDays("2026-11-30", 2)).toBe("2026-12-02");
	});

	it("walks the 2-2-2 cycle and repeats after 6 days", () => {
		const start = "2026-11-09";
		const week = [0, 1, 2, 3, 4, 5, 6].map((n) => crewShiftOn(twelve, start, addDays(start, n)));
		expect(week).toEqual(["day", "day", "night", "night", "off", "off", "day"]);
		expect(crewShiftOn(twelve, start, "2026-11-08")).toBeNull();
	});

	it("three crews 2 days apart put exactly one crew on days and one on nights", () => {
		const crews = [0, 2, 4].map((o, i) => ({
			id: `c${i}`,
			name: `Crew ${"ABC"[i]}`,
			meta: { patternId: "p12", startDate: addDays("2026-11-09", -o) },
		}));
		for (let d = 0; d < 12; d++) {
			const g = crewsByShift(crews, [twelve], addDays("2026-11-09", d));
			expect(g.day).toHaveLength(1);
			expect(g.night).toHaveLength(1);
			expect(g.off).toHaveLength(1);
		}
	});
});

describe("crew metadata", () => {
	it("round-trips through the group description", () => {
		const meta = { patternId: "p12", startDate: "2026-11-09", conversationId: "c1" };
		expect(readCrewMeta({ description: writeCrewDescription(meta) })).toEqual(meta);
		expect(readCrewMeta({ description: "Ordinary group" })).toBeNull();
	});

	it("prefers real backend fields when they exist", () => {
		expect(readCrewMeta({ shiftPatternId: "p", crewStartDate: "2026-11-09T00:00:00Z" })).toEqual({
			patternId: "p",
			startDate: "2026-11-09",
			conversationId: undefined,
		});
	});
});
