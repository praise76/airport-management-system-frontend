// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ activities: null as any, invoices: null as any, decide: vi.fn() }));

vi.mock("@/hooks/stakeholder-portal", () => ({
	useHeldActivities: () => ({ data: mocks.activities, isLoading: false, isError: false }),
	useHeldInvoices: () => ({ data: mocks.invoices, isLoading: false, isError: false }),
	useDecideHeldItem: () => ({ mutate: mocks.decide, isPending: false }),
	useItemTrail: () => ({
		data: [
			{ stepNumber: 1, stepType: "submitted", toOffice: "RGM", toOfficeId: "off-rgm", at: "2026-11-10T22:17:00Z" },
			{ stepNumber: 2, stepType: "forwarded", fromOfficeId: "off-rgm", toOffice: "Passenger Screening", toOfficeId: "off-scr", at: "2026-11-10T22:22:00Z" },
		],
		isLoading: false,
		isError: false,
	}),
	useForwardItem: () => ({ mutate: vi.fn(), isPending: false }),
	useReturnItem: () => ({ mutate: vi.fn(), isPending: false }),
	useAcknowledgeItem: () => ({ mutate: vi.fn(), isPending: false }),
	useReviewStakeholderActivity: vi.fn(),
	useReviewStakeholderInvoice: vi.fn(),
	useStakeholderInvoices: vi.fn(),
}));
vi.mock("@/hooks/departments", () => ({ useDepartmentTree: () => ({ data: [] }) }));
vi.mock("@/hooks/positions", () => ({ usePositions: () => ({ data: [] }) }));
vi.mock("@/hooks/users", () => ({ useUsers: () => ({ data: { data: [] } }) }));
vi.mock("./documents/useDocumentFileViewer", () => ({
	useDocumentFileViewer: () => ({ open: vi.fn(), loadingId: null, viewer: null }),
}));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: any) => <a href="/">{children}</a> }));
// An ordinary officer: no stakeholder role, and the user record carries no position.
vi.mock("@/stores/auth", () => ({ useAuthStore: (selector: any) => selector({ user: { id: "u1", role: "officer" } }) }));

import { HeldInvoices, HeldRequests } from "./OfficeInbox";

const junk = {
	id: "a1",
	stakeholderOrganizationId: "org1",
	organizationName: "Skyline Cafe",
	activityType: "other",
	activityTitle: "Request to move out junk",
	activityReference: "OTH-2026-667883",
	status: "submitted",
	createdAt: "2026-11-10T22:17:00Z",
	currentOffice: "Passenger Screening",
	currentOfficeId: "off-scr",
	data: { documentId: "d1", fileName: "letter.pdf" },
};

afterEach(cleanup);
beforeEach(() => {
	vi.clearAllMocks();
	mocks.activities = null;
	mocks.invoices = null;
});

describe("office inbox", () => {
	it("shows a request held by my office with its letter and every action", () => {
		mocks.activities = [junk];
		render(<HeldRequests />);
		expect(screen.getByText("Request to move out junk")).toBeTruthy();
		expect(screen.getByText("Skyline Cafe")).toBeTruthy();
		for (const name of ["View letter", "Timeline", "Return to RGM", "Minute to…", "Reject", "Approve"])
			expect(screen.getByRole("button", { name })).toBeTruthy();
	});

	it("approves from the inbox", () => {
		mocks.activities = [junk];
		render(<HeldRequests />);
		fireEvent.click(screen.getByRole("button", { name: "Approve" }));
		expect(mocks.decide).toHaveBeenCalledWith({ id: "a1", decision: "approved" });
	});

	it("says so when nothing is with the office", () => {
		mocks.activities = [];
		mocks.invoices = [];
		render(
			<>
				<HeldRequests />
				<HeldInvoices />
			</>,
		);
		expect(screen.getByText("No requests are with your office.")).toBeTruthy();
		expect(screen.getByText("No invoices are with your office.")).toBeTruthy();
	});

	it("shows nothing for a list the server doesn't offer yet", () => {
		const { container } = render(
			<>
				<HeldRequests />
				<HeldInvoices />
			</>,
		);
		expect(container.textContent).toBe("");
	});

	it("shows an invoice held by my office", () => {
		mocks.invoices = [
			{ id: "i1", stakeholderOrganizationId: "org1", organizationName: "Skyline Cafe", invoiceNumber: "INV-014", description: "Cleaning", total: 1075, status: "submitted", invoiceDate: "2026-11-10", dueDate: "2026-12-10", currentOffice: "Commercial", currentOfficeId: "off-com", createdAt: "2026-11-10T10:00:00Z" },
		];
		render(<HeldInvoices />);
		expect(screen.getByText("INV-014")).toBeTruthy();
		expect(screen.getByRole("button", { name: "Minute to…" })).toBeTruthy();
	});
});
