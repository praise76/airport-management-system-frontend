// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	user: { id: "u-acos", role: "officer", departmentId: "off-acos" } as any,
	forward: vi.fn(),
	back: vi.fn(),
	upload: vi.fn(),
	trail: null as any,
}));

vi.mock("@/hooks/stakeholder-portal", () => ({
	useItemTrail: () => ({ data: mocks.trail, isLoading: false, isError: false }),
	useForwardItem: () => ({ mutate: mocks.forward, isPending: false }),
	useReturnItem: () => ({ mutate: mocks.back, isPending: false }),
	useAcknowledgeItem: () => ({ mutate: vi.fn(), isPending: false }),
	useUploadAttachment: () => ({ mutateAsync: mocks.upload, isPending: false }),
}));
vi.mock("@/hooks/departments", () => ({
	useDepartmentTree: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/hooks/positions", () => ({ usePositions: () => ({ data: [] }) }));
vi.mock("@/hooks/users", () => ({ useDepartmentStaff: () => ({ data: [] }) }));
vi.mock("@/stores/auth", () => ({
	useAuthStore: (selector: any) => selector({ user: mocks.user }),
}));

import { CurrentlyWith, PermitTrail, TrailSection } from "./PermitTrail";
import { DecisionButtons } from "./ReviewActions";
import { RoutingButtons, nextOffices } from "./RoutingActions";

afterEach(cleanup);

const steps = [
	{
		stepNumber: 1,
		stepType: "submitted" as const,
		toOffice: "RGM's office",
		at: "2026-11-12T09:00:00Z",
	},
	{
		stepNumber: 2,
		stepType: "forwarded" as const,
		toOffice: "Airport Chief of Security",
		at: "2026-11-12T10:00:00Z",
		minute: "Please vet the applicant",
		actorName: "Ada Obi",
		toOfficerName: "Musa Bello",
	},
];
const permit = {
	id: "p1",
	status: "pending",
	createdAt: "2026-11-12T09:00:00Z",
	currentOffice: "Airport Chief of Security",
	currentOfficeId: "off-acos",
	currentOfficeSince: "2026-11-12T10:00:00Z",
};

describe("PermitTrail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.user = { id: "u-acos", role: "officer", departmentId: "off-acos" };
		mocks.trail = null;
	});

	it("shows a concessionaire the offices in order, without minutes or staff names", () => {
		render(<PermitTrail steps={steps} surface="portal" />);
		const items = screen.getAllByRole("listitem");
		expect(items[0].textContent).toContain("Submitted to RGM's office");
		expect(items[1].textContent).toContain(
			"Forwarded to Airport Chief of Security",
		);
		expect(document.body.textContent).not.toMatch(
			/Please vet|Ada Obi|Musa Bello/,
		);
	});

	it("shows staff the minute, who acted and the named officer", () => {
		render(<PermitTrail steps={steps} surface="staff" />);
		expect(screen.getByText("Please vet the applicant")).toBeTruthy();
		expect(document.body.textContent).toMatch(/Ada Obi/);
		expect(document.body.textContent).toMatch(/for Musa Bello/);
	});

	it("says which office has it", () => {
		render(<CurrentlyWith item={permit} surface="portal" />);
		expect(
			screen.getByText(
				"Currently with: Airport Chief of Security, since 12 Nov 2026",
			),
		).toBeTruthy();
	});

	it("falls back to Submitted when the server has no trail yet", () => {
		render(
			<TrailSection
				kind="permits"
				item={{ ...permit, currentOffice: "RGM's office" }}
				surface="portal"
			/>,
		);
		expect(screen.getByText("Submitted to RGM's office")).toBeTruthy();
	});
});

describe("RoutingButtons and DecisionButtons", () => {
	// RGM minuted it to ACOS: ACOS holds it and can return it up to the RGM.
	const chain = [
		{ stepNumber: 1, stepType: "submitted" as const, toOffice: "RGM", toOfficeId: "off-rgm", at: "2026-11-12T09:00:00Z" },
		{ stepNumber: 2, stepType: "forwarded" as const, fromOfficeId: "off-rgm", toOffice: "Airport Chief of Security", toOfficeId: "off-acos", at: "2026-11-12T10:00:00Z" },
	];
	const render2 = (extra = {}) =>
		render(
			<>
				<RoutingButtons kind="permits" item={permit} name="Ada's permit" {...extra} />
				<DecisionButtons item={permit} rejectTitle="Reject?" onApprove={() => {}} onReject={() => {}} {...extra} />
			</>,
		);

	beforeEach(() => {
		vi.clearAllMocks();
		mocks.user = { id: "u-acos", role: "officer", departmentId: "off-acos" };
		mocks.trail = chain;
	});

	it("offers Minute, Return up the chain, Approve and Reject to the office that holds the permit", () => {
		render2();
		for (const name of ["Minute to…", "Return to RGM", "Approve", "Reject", "Timeline"])
			expect(screen.getByRole("button", { name })).toBeTruthy();
	});

	it("hides them from another office while ACOS holds the permit", () => {
		mocks.user = { id: "u-rgm", role: "officer", departmentId: "off-rgm", canManageStakeholders: true };
		render2();
		for (const name of ["Minute to…", "Return to RGM", "Approve", "Reject"])
			expect(screen.queryByRole("button", { name })).toBeNull();
		expect(screen.getByRole("button", { name: "Timeline" })).toBeTruthy();
	});

	it("trusts the server's 'With my office' list when the user's own office isn't known", () => {
		mocks.user = { id: "u-cii", role: "officer" };
		render2({ held: true });
		for (const name of ["Minute to…", "Return to RGM", "Approve", "Reject"])
			expect(screen.getByRole("button", { name })).toBeTruthy();
	});

	it("has no Return at the top of the chain", () => {
		mocks.trail = chain.slice(0, 1);
		render2();
		expect(screen.queryByRole("button", { name: /Return to/ })).toBeNull();
		expect(screen.getByRole("button", { name: "Minute to…" })).toBeTruthy();
	});

	it("hides Minute and Return once the permit is decided", () => {
		render(<RoutingButtons kind="permits" item={{ ...permit, status: "approved" }} name="Ada's permit" />);
		expect(screen.queryByRole("button", { name: "Minute to…" })).toBeNull();
	});

	it("won't minute without an office and a minute", () => {
		render2();
		fireEvent.click(screen.getByRole("button", { name: "Minute to…" }));
		const submit = screen.getByRole("button", { name: "Minute" }) as HTMLButtonElement;
		expect(submit.disabled).toBe(true);
		fireEvent.change(screen.getByLabelText("Minute"), { target: { value: "For vetting, please." } });
		expect(submit.disabled).toBe(true); // still nobody chosen
		expect(mocks.forward).not.toHaveBeenCalled();
	});

	it("returns up the chain with the server's return when that is where it goes", () => {
		render2();
		fireEvent.click(screen.getByRole("button", { name: "Return to RGM" }));
		fireEvent.change(screen.getByLabelText("Minute"), { target: { value: "Vetted. No objection." } });
		fireEvent.click(screen.getByRole("button", { name: "Return" }));
		expect(mocks.back).toHaveBeenCalledWith({ id: "p1", minute: "Vetted. No objection.", attachments: undefined }, expect.anything());
		expect(mocks.forward).not.toHaveBeenCalled();
	});

	it("still just returns after a lower office returned it: the server now sends it up the chain", () => {
		// RGM -> ACOS -> CII, CII returned to ACOS. A return goes up to the RGM; no forward work-around.
		mocks.trail = [
			...chain,
			{ stepNumber: 3, stepType: "forwarded" as const, fromOfficeId: "off-acos", toOffice: "CII", toOfficeId: "off-cii", at: "2026-11-12T11:00:00Z" },
			{ stepNumber: 4, stepType: "returned" as const, fromOfficeId: "off-cii", toOffice: "Airport Chief of Security", toOfficeId: "off-acos", at: "2026-11-12T12:00:00Z" },
		];
		render2();
		fireEvent.click(screen.getByRole("button", { name: "Return to RGM" }));
		fireEvent.change(screen.getByLabelText("Minute"), { target: { value: "Find attached treated report." } });
		fireEvent.click(screen.getByRole("button", { name: "Return" }));
		expect(mocks.forward).not.toHaveBeenCalled();
		expect(mocks.back).toHaveBeenCalledWith(
			{ id: "p1", minute: "Find attached treated report.", attachments: undefined },
			expect.anything(),
		);
	});

	it("attaches a file to a minute and sends its id with the return", async () => {
		mocks.upload.mockResolvedValue({ id: "att-1", name: "treated-job-completion.pdf", mimeType: "application/pdf", size: 2048 });
		render2();
		fireEvent.click(screen.getByRole("button", { name: "Return to RGM" }));
		fireEvent.change(screen.getByLabelText("Minute"), { target: { value: "Find attached treated job completion." } });
		const file = new File(["%PDF-1.4"], "treated-job-completion.pdf", { type: "application/pdf" });
		fireEvent.change(screen.getByTestId("attachment-input"), { target: { files: [file] } });
		expect(await screen.findByText("treated-job-completion.pdf")).toBeTruthy();
		expect(mocks.upload).toHaveBeenCalledWith(file);
		fireEvent.click(screen.getByRole("button", { name: "Return" }));
		expect(mocks.back).toHaveBeenCalledWith(
			{ id: "p1", minute: "Find attached treated job completion.", attachments: ["att-1"] },
			expect.anything(),
		);
	});

	it("does not upload a file that is not a PDF or image, and a removed file is not sent", async () => {
		mocks.upload.mockResolvedValue({ id: "att-2", name: "a.png", mimeType: "image/png", size: 10 });
		render2();
		fireEvent.click(screen.getByRole("button", { name: "Return to RGM" }));
		fireEvent.change(screen.getByLabelText("Minute"), { target: { value: "Attached the photo." } });
		const input = screen.getByTestId("attachment-input");
		fireEvent.change(input, { target: { files: [new File(["x"], "notes.docx", { type: "application/msword" })] } });
		expect(mocks.upload).not.toHaveBeenCalled();
		fireEvent.change(input, { target: { files: [new File(["x"], "a.png", { type: "image/png" })] } });
		fireEvent.click(await screen.findByRole("button", { name: "Remove a.png" }));
		fireEvent.click(screen.getByRole("button", { name: "Return" }));
		expect(mocks.back).toHaveBeenCalledWith({ id: "p1", minute: "Attached the photo.", attachments: undefined }, expect.anything());
	});
});

describe("attached files on the timeline", () => {
	const withFile = [
		{ stepNumber: 1, stepType: "submitted" as const, toOffice: "RGM's office", at: "2026-11-12T09:00:00Z" },
		{
			stepNumber: 2,
			stepType: "returned" as const,
			toOffice: "RGM's office",
			at: "2026-11-12T10:00:00Z",
			minute: "Treated job completion attached",
			attachments: [{ id: "att-1", name: "treated-job-completion.pdf", mimeType: "application/pdf", size: 2048 }],
		},
	];
	it("shows the files to staff, with their size", () => {
		render(<PermitTrail steps={withFile} surface="staff" kind="activities" itemId="a1" />);
		expect(screen.getByRole("button", { name: /treated-job-completion\.pdf \(2 KB\)/ })).toBeTruthy();
	});
	it("never shows them to the company", () => {
		render(<PermitTrail steps={withFile} surface="portal" kind="activities" itemId="a1" />);
		expect(screen.queryByText(/treated-job-completion/)).toBeNull();
	});
});

describe("nextOffices", () => {
	const all = [
		{ value: "department:env", id: "env", type: "department" as const, name: "Environmental Services", label: "Environmental Services", parentId: null, level: 1 },
		{ value: "unit:fm", id: "fm", type: "unit" as const, name: "Facility Maintenance", label: "— Facility Maintenance", parentId: "env", level: 2 },
		{ value: "department:acc", id: "acc", type: "department" as const, name: "Accounts", label: "Accounts", parentId: null, level: 1 },
		{ value: "position:rgm", id: "rgm", type: "position" as const, name: "RGM", label: "RGM (position)" },
	];
	it("offers the RGM the departments' HODs", () => {
		expect(nextOffices(all, { id: "rgm", type: "position" }).options.map((o) => o.hint)).toEqual([
			"HOD, Environmental Services",
			"HOD, Accounts",
		]);
	});
	it("offers an HOD the department's units and its own staff", () => {
		expect(nextOffices(all, { id: "env", type: "department" }).options.map((o) => o.hint)).toEqual([
			"Head of unit, Facility Maintenance",
			"A member of staff in Environmental Services",
		]);
	});
	it("offers a head of unit the unit's own staff", () => {
		expect(nextOffices(all, { id: "fm", type: "unit" }).options.map((o) => o.hint)).toEqual([
			"A member of staff in Facility Maintenance",
		]);
	});
});
