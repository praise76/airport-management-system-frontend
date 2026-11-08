import { describe, expect, it, vi } from "vitest";
import { normalizeSwap } from "./swaps";

vi.mock("./client", () => ({ api: {} }));

describe("swap normalisation (QA RST-05)", () => {
	it("reads the reason from swapReason and joins people's names", () => {
		const s = normalizeSwap({
			id: "s1",
			swapReason: "Medical appointment",
			requestingStaff: { firstName: "Emeka", lastName: "Eze" },
			targetStaffId: null,
		});
		expect(s.reason).toBe("Medical appointment");
		expect(s.requesterName).toBe("Emeka Eze");
		expect(s.targetName).toBeUndefined();
	});
});
