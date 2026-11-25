import { describe, expect, it } from "vitest";
import type { Department } from "@/types/department";
import { avsecCodes, channelUnitCode, showChat } from "./chatRules";

const d = (id: string, name: string, code: string, parent?: string) =>
	({ id, name, code, parentDepartmentId: parent ?? null, departmentLevel: parent ? 2 : 1 }) as unknown as Department;
const deps = [
	d("a", "Aviation Security (AVSEC)", "AVSEC"),
	d("ps", "Passenger Screening", "PSCRN", "a"),
	d("e", "Environmental Services", "ENVSC"),
	d("w", "Wildlife and Bird Control", "WLDMG", "e"),
];

describe("chat rules", () => {
	const avsec = avsecCodes(deps);
	it("knows AVSEC units by their parent", () => {
		expect([...avsec].sort()).toEqual(["AVSEC", "PSCRN"]);
	});
	it("reads the unit code from a channel code", () => {
		expect(channelUnitCode({ settings: { channelCode: "WLDMG-X-GENERAL" } })).toBe("WLDMG");
		expect(channelUnitCode({ settings: {} })).toBeNull();
	});
	it("shows station channels only for AVSEC", () => {
		expect(showChat({ settings: { isStationChannel: true, channelCode: "PSCRN-TDT-GENERAL" } }, avsec)).toBe(true);
		expect(showChat({ settings: { isStationMasterChannel: true, channelCode: "WLDMG-WILDLIFE-MASTER" } }, avsec)).toBe(false);
	});
	it("hides the duplicate check-in unit chat for everyone", () => {
		expect(showChat({ settings: { isUnitChannel: true, channelCode: "PSCRN-UNIT" } }, avsec)).toBe(false);
	});
	it("keeps permanent groups and shows everything while departments load", () => {
		expect(showChat({ settings: { isShiftGroup: true } }, avsec)).toBe(true);
		expect(showChat({ settings: { isStationChannel: true, channelCode: "WLDMG-X" } }, null)).toBe(true);
	});
});
