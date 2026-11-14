import { describe, expect, it } from "vitest";
import { authorityOffices, permitStage } from "./permitAuthority";

const positions = [
	{ id: "rgm", title: "Regional General Manager (RGM)", code: "RGM" },
	{ id: "acos", title: "Airport Chief of Security (ACOS)", code: "ACOS" },
	{ id: "hod", title: "Head of Department", code: "HOD-x" },
];
const offices = authorityOffices(positions);

describe("authorityOffices", () => {
	it("finds the RGM and ACOS by code or title", () => {
		expect(offices.rgm?.id).toBe("rgm");
		expect(offices.acos?.id).toBe("acos");
		expect(
			authorityOffices([{ id: "x", title: "Airport Chief of Security (ACOS)" }])
				.acos?.id,
		).toBe("x");
	});
});

describe("permitStage", () => {
	const at = (id: string, extra = {}) => ({
		status: "pending",
		permitType: "temporary",
		currentOfficeId: id,
		...extra,
	});
	it("lets the RGM approve, and nobody else decide", () => {
		expect(permitStage(at("rgm"), offices)).toBe("with_rgm");
		expect(
			permitStage(at("hod", { currentOfficeType: "position" }), offices),
		).toBe("elsewhere");
		expect(
			permitStage(at("env", { currentOfficeType: "department" }), offices),
		).toBe("elsewhere");
	});
	it("lets ACOS issue only after the RGM has approved", () => {
		expect(permitStage(at("acos"), offices)).toBe("with_acos_waiting");
		expect(
			permitStage(at("acos"), offices, [
				{
					stepNumber: 2,
					stepType: "forwarded",
					fromOfficeId: "rgm",
					toOfficeId: "acos",
					at: "x",
				},
			]),
		).toBe("with_acos_ready");
		expect(
			permitStage(at("acos", { rgmApprovedAt: "2026-11-14" }), offices),
		).toBe("with_acos_ready");
	});
	it("lets ACOS issue a visitor permit alone", () => {
		expect(permitStage(at("acos", { permitType: "visitor" }), offices)).toBe(
			"with_acos_ready",
		);
	});
	it("holds a contractor's permit at the RGM until its HOD sends the letter of introduction", () => {
		expect(
			permitStage(at("rgm", { sponsorDepartmentId: "env" }), offices),
		).toBe("with_rgm_waiting_hod");
		expect(
			permitStage(
				at("rgm", { sponsorDepartmentId: "env", introducedAt: "2026-11-14" }),
				offices,
			),
		).toBe("with_rgm");
		expect(
			permitStage(at("rgm", { sponsorDepartmentId: "env" }), offices, [
				{ stepNumber: 2, stepType: "introduced", at: "x" },
			]),
		).toBe("with_rgm");
	});
	it("does nothing once decided", () => {
		expect(permitStage({ ...at("rgm"), status: "approved" }, offices)).toBe(
			"decided",
		);
	});
});
