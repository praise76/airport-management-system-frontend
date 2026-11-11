import { describe, expect, it } from "vitest";
import {
	assignedWithinOffice,
	currentlyWith,
	fallbackTrail,
	holdsItem,
	isOpen,
	noticeText,
	readRouting,
	redactForConcessionaire,
	toTrail,
} from "./routing";

const RGM = "off-rgm";
const ACOS = "off-acos";

describe("readRouting", () => {
	it("reads the holder from flat fields or an office object", () => {
		expect(
			readRouting({
				currentOffice: "RGM's office",
				currentOfficeId: RGM,
				currentOfficeSince: "2026-11-12T09:00:00Z",
			}),
		).toMatchObject({
			currentOffice: "RGM's office",
			currentOfficeId: RGM,
		});
		expect(
			readRouting({
				currentOffice: { id: ACOS, name: "Airport Chief of Security" },
			}),
		).toMatchObject({
			currentOffice: "Airport Chief of Security",
			currentOfficeId: ACOS,
		});
		expect(readRouting({}).currentOffice).toBeUndefined();
	});
});

describe("toTrail", () => {
	const rows = [
		{
			stepNumber: 2,
			stepType: "forwarded",
			toOffice: { id: ACOS, name: "Airport Chief of Security" },
			createdAt: "2026-11-12T10:00:00Z",
			minute: "Please vet",
			actorName: "Ada Obi",
		},
		{
			stepNumber: 1,
			stepType: "submitted",
			toOfficeName: "RGM's office",
			createdAt: "2026-11-12T09:00:00Z",
		},
		{
			stepNumber: 3,
			stepType: "teleported",
			createdAt: "2026-11-12T11:00:00Z",
		},
	];
	it("orders steps oldest first and drops unknown step types", () => {
		const trail = toTrail(rows);
		expect(trail.map((s) => s.stepType)).toEqual(["submitted", "forwarded"]);
		expect(trail[1].toOffice).toBe("Airport Chief of Security");
	});
	it("accepts a { steps } envelope", () => {
		expect(toTrail({ steps: rows })).toHaveLength(2);
	});
});

describe("redactForConcessionaire", () => {
	it("keeps step type, office and time only", () => {
		const [step] = redactForConcessionaire([
			{
				stepNumber: 2,
				stepType: "forwarded",
				toOffice: "Airport Chief of Security",
				toOfficeId: ACOS,
				at: "2026-11-12T10:00:00Z",
				minute: "Please vet",
				actorName: "Ada Obi",
				toOfficerName: "Musa Bello",
			},
		]);
		expect(step).toEqual({
			stepNumber: 2,
			stepType: "forwarded",
			fromOffice: undefined,
			toOffice: "Airport Chief of Security",
			at: "2026-11-12T10:00:00Z",
		});
		expect(JSON.stringify(step)).not.toMatch(/Please vet|Ada Obi|Musa Bello/);
	});
});

describe("fallbackTrail", () => {
	it("shows Submitted for a pending item, with its office if known", () => {
		expect(
			fallbackTrail({
				createdAt: "2026-11-01T08:00:00Z",
				status: "pending",
				currentOffice: "RGM's office",
			}),
		).toEqual([
			{
				stepNumber: 1,
				stepType: "submitted",
				toOffice: "RGM's office",
				at: "2026-11-01T08:00:00Z",
			},
		]);
	});
	it("adds the decision once decided", () => {
		const t = fallbackTrail({
			createdAt: "2026-11-01T08:00:00Z",
			status: "approved",
			approvedAt: "2026-11-03T08:00:00Z",
		});
		expect(t.map((s) => s.stepType)).toEqual(["submitted", "approved"]);
	});
});

describe("holdsItem", () => {
	const held = {
		currentOffice: "Airport Chief of Security",
		currentOfficeId: ACOS,
	};
	it("lets the holding office act and refuses other offices", () => {
		expect(holdsItem({ departmentId: ACOS }, held)).toBe(true);
		expect(holdsItem({ unitDepartmentId: ACOS }, held)).toBe(true);
		expect(holdsItem({ departmentId: RGM }, held)).toBe(false);
	});
	it("lets a super admin and the named officer act", () => {
		expect(holdsItem({ role: "super_admin", departmentId: RGM }, held)).toBe(
			true,
		);
		expect(
			holdsItem(
				{ id: "u1", departmentId: RGM },
				{ ...held, currentOfficerId: "u1" },
			),
		).toBe(true);
	});
	it("changes nothing while the server sends no holder", () => {
		expect(holdsItem({ departmentId: RGM }, {})).toBe(true);
		expect(holdsItem(null, {})).toBe(false);
	});
});

describe("labels", () => {
	it("says who has it and since when", () => {
		expect(
			currentlyWith({
				currentOffice: "Airport Chief of Security",
				currentOfficeSince: "2026-11-12T10:00:00Z",
			}),
		).toBe("Currently with: Airport Chief of Security, since 12 Nov 2026");
		expect(currentlyWith({})).toBeNull();
	});
	it("writes notices that name the item and the office", () => {
		expect(
			noticeText({
				itemLabel: "Permit PER-2026-01627",
				stepType: "forwarded",
				office: "CII",
			}),
		).toBe("Permit PER-2026-01627 is now with CII.");
		expect(
			noticeText({
				itemLabel: "Permit PER-2026-01627",
				stepType: "approved",
				office: "Airport Chief of Security",
			}),
		).toBe("Permit PER-2026-01627 was approved by Airport Chief of Security.");
	});
	it("knows which statuses are still moving", () => {
		expect(isOpen("permits", "pending")).toBe(true);
		expect(isOpen("permits", "approved")).toBe(false);
		expect(isOpen("invoices", "under_review")).toBe(true);
	});
});

import { cleanPeople, duplicateNames } from "@/api/stakeholder-portal";

describe("one application for several people", () => {
	it("keeps named rows only, trimmed", () => {
		expect(
			cleanPeople([
				{ personName: "  Ada Obi ", personDesignation: " Supervisor " },
				{ personName: "   ", personDesignation: "x" },
				{ personName: "Musa Bello", personDesignation: "" },
			]),
		).toEqual([
			{ personName: "Ada Obi", personDesignation: "Supervisor" },
			{ personName: "Musa Bello", personDesignation: undefined },
		]);
	});
	it("spots the same name listed twice", () => {
		expect(duplicateNames([{ personName: "Ada Obi" }, { personName: "ada obi" }, { personName: "Musa Bello" }])).toEqual(["ada obi"]);
		expect(duplicateNames([{ personName: "Ada Obi" }, { personName: "Musa Bello" }])).toEqual([]);
	});
});

import { requestLetterOf } from "@/api/stakeholder-portal";

describe("request letters", () => {
	it("finds the uploaded letter on a request", () => {
		expect(requestLetterOf({ data: { documentId: "d1", fileName: "junk.pdf", mimeType: "application/pdf" } })).toEqual({
			documentId: "d1",
			fileName: "junk.pdf",
			mimeType: "application/pdf",
		});
	});
	it("returns nothing for an ordinary activity", () => {
		expect(requestLetterOf({ data: { description: "Leaking tap" } })).toBeNull();
		expect(requestLetterOf({ data: undefined as any })).toBeNull();
	});
});

import { chainOf, returnTarget, serverReturnTarget } from "./routing";

describe("returning up the chain", () => {
	const step = (n: number, stepType: any, from: string | undefined, to: string) => ({
		stepNumber: n,
		stepType,
		fromOfficeId: from,
		toOfficeId: to,
		toOffice: to.toUpperCase(),
		at: `2026-11-10T10:0${n}:00Z`,
	});
	const down = [step(1, "submitted", undefined, "rgm"), step(2, "forwarded", "rgm", "env"), step(3, "forwarded", "env", "fm")];

	it("follows the chain down: RGM, HOD, HOU", () => {
		expect(chainOf(down).map((o) => o.id)).toEqual(["rgm", "env", "fm"]);
		expect(returnTarget(down)?.id).toBe("env");
	});
	it("after the HOU returns to the HOD, the HOD returns to the RGM, not back to the HOU", () => {
		const t = [...down, step(4, "returned", "fm", "env")];
		expect(chainOf(t).map((o) => o.id)).toEqual(["rgm", "env"]);
		expect(returnTarget(t)?.id).toBe("rgm");
		expect(serverReturnTarget(t)).toBe("fm"); // what the server does today
	});
	it("after it is back with the RGM there is nowhere to return to, and it can go to Accounts", () => {
		const t = [...down, step(4, "returned", "fm", "env"), step(5, "forwarded", "env", "rgm")];
		expect(chainOf(t).map((o) => o.id)).toEqual(["rgm"]);
		expect(returnTarget(t)).toBeNull();
		expect(chainOf([...t, step(6, "forwarded", "rgm", "acc")]).map((o) => o.id)).toEqual(["rgm", "acc"]);
	});
	it("ignores acknowledgements", () => {
		expect(chainOf([...down, step(4, "acknowledged", undefined, "fm")]).map((o) => o.id)).toEqual(["rgm", "env", "fm"]);
	});
});

describe("named officers inside an office", () => {
	const step = (n: number, stepType: string, extra: Record<string, unknown> = {}) => ({
		stepNumber: n,
		stepType,
		createdAt: `2026-11-12T09:0${n}:00Z`,
		...extra,
	});
	const rows = [
		step(1, "submitted", { toOffice: { id: "rgm", name: "RGM" } }),
		step(2, "forwarded", { toOffice: { id: "env", name: "Environment" } }),
		step(3, "assigned", { toOffice: { id: "env", name: "Environment" }, toOfficerId: "u1", toOfficerName: "Ada Obi" }),
	];

	it("keeps the assigned step in the staff trail with its officer", () => {
		const trail = toTrail(rows);
		expect(trail.map((s) => s.stepType)).toEqual(["submitted", "forwarded", "assigned"]);
		expect(trail[2].toOfficerId).toBe("u1");
	});

	it("does not change the chain of offices", () => {
		expect(chainOf(toTrail(rows)).map((o) => o.id)).toEqual(["rgm", "env"]);
	});

	it("knows when the holder is the person the head minuted it to", () => {
		const trail = toTrail(rows);
		expect(assignedWithinOffice(trail, "u1")).toBe(true);
		expect(assignedWithinOffice(trail, "someone-else")).toBe(false);
		expect(assignedWithinOffice(trail, undefined)).toBe(false);
	});

	it("is false once the person hands it back or it moves on", () => {
		const back = toTrail([...rows, step(4, "returned", { toOffice: { id: "env", name: "Environment" } })]);
		expect(assignedWithinOffice(back, "u1")).toBe(false);
		const onward = toTrail([...rows, step(4, "forwarded", { toOffice: { id: "fm", name: "Facility Maintenance" } })]);
		expect(assignedWithinOffice(onward, "u1")).toBe(false);
	});

	it("ignores a receipt after the assignment", () => {
		const ack = toTrail([...rows, step(4, "acknowledged", { toOffice: { id: "env", name: "Environment" } })]);
		expect(assignedWithinOffice(ack, "u1")).toBe(true);
	});
});
