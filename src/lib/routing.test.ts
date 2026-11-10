import { describe, expect, it } from "vitest";
import {
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
