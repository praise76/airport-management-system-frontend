import { describe, expect, it } from "vitest";
import {
	coverPosition,
	isCovering,
	stationTerminal,
	usualPostOf,
} from "./cover";

describe("cover for today", () => {
	it("records the post covered and the usual post, and reads it back", () => {
		const p = coverPosition("TDT Airside Access Gate", "GAT Screening");
		expect(p).toBe(
			"Covering TDT Airside Access Gate today (normally GAT Screening)",
		);
		expect(usualPostOf(p)).toBe("GAT Screening");
		expect(isCovering(p)).toBe(true);
	});
	it("is not covering for an ordinary position", () => {
		expect(isCovering("Screening officer")).toBe(false);
		expect(usualPostOf(undefined)).toBeUndefined();
	});
	it("reads the station's terminal from either form", () => {
		expect(stationTerminal('["TDT","IT2"]')).toBe("TDT");
		expect(stationTerminal(["IT2"])).toBe("IT2");
		expect(stationTerminal(null)).toBeUndefined();
	});
});
