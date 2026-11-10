// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	user: { id: "u-acos", role: "officer", departmentId: "off-acos" } as any,
	forward: vi.fn(),
	trail: null as any,
}));

vi.mock("@/hooks/stakeholder-portal", () => ({
	useItemTrail: () => ({ data: mocks.trail, isLoading: false, isError: false }),
	useForwardItem: () => ({ mutate: mocks.forward, isPending: false }),
	useReturnItem: () => ({ mutate: vi.fn(), isPending: false }),
	useAcknowledgeItem: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/departments", () => ({
	useDepartmentTree: () => ({ data: [], isLoading: false }),
}));
vi.mock("@/hooks/positions", () => ({ usePositions: () => ({ data: [] }) }));
vi.mock("@/hooks/users", () => ({ useUsers: () => ({ data: { data: [] } }) }));
vi.mock("@/stores/auth", () => ({
	useAuthStore: (selector: any) => selector({ user: mocks.user }),
}));

import { CurrentlyWith, PermitTrail, TrailSection } from "./PermitTrail";
import { DecisionButtons } from "./ReviewActions";
import { RoutingButtons } from "./RoutingActions";

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
	beforeEach(() => {
		mocks.user = { id: "u-acos", role: "officer", departmentId: "off-acos" };
	});

	it("offers Forward, Return, Approve and Reject to the office that holds the permit", () => {
		render(
			<>
				<RoutingButtons kind="permits" item={permit} name="Ada's permit" />
				<DecisionButtons
					item={permit}
					rejectTitle="Reject?"
					onApprove={() => {}}
					onReject={() => {}}
				/>
			</>,
		);
		for (const name of ["Forward", "Return", "Approve", "Reject", "Timeline"])
			expect(screen.getByRole("button", { name })).toBeTruthy();
	});

	it("hides them from another office while ACOS holds the permit", () => {
		mocks.user = {
			id: "u-rgm",
			role: "officer",
			departmentId: "off-rgm",
			canManageStakeholders: true,
		};
		render(
			<>
				<RoutingButtons kind="permits" item={permit} name="Ada's permit" />
				<DecisionButtons
					item={permit}
					rejectTitle="Reject?"
					onApprove={() => {}}
					onReject={() => {}}
				/>
			</>,
		);
		for (const name of ["Forward", "Return", "Approve", "Reject"])
			expect(screen.queryByRole("button", { name })).toBeNull();
		expect(screen.getByRole("button", { name: "Timeline" })).toBeTruthy();
	});

	it("trusts the server's 'With my office' list when the user's own office isn't known", () => {
		mocks.user = { id: "u-cii", role: "officer" };
		render(
			<>
				<RoutingButtons kind="permits" held item={permit} name="Ada's permit" />
				<DecisionButtons held item={permit} rejectTitle="Reject?" onApprove={() => {}} onReject={() => {}} />
			</>,
		);
		for (const name of ["Forward", "Return", "Approve", "Reject"])
			expect(screen.getByRole("button", { name })).toBeTruthy();
	});

	it("hides Forward and Return once the permit is decided", () => {
		render(
			<RoutingButtons
				kind="permits"
				item={{ ...permit, status: "approved" }}
				name="Ada's permit"
			/>,
		);
		expect(screen.queryByRole("button", { name: "Forward" })).toBeNull();
	});

	it("won't forward without an office and a minute", () => {
		render(<RoutingButtons kind="permits" item={permit} name="Ada's permit" />);
		fireEvent.click(screen.getByRole("button", { name: "Forward" }));
		const submit = screen
			.getAllByRole("button", { name: "Forward" })
			.pop() as HTMLButtonElement;
		expect(submit.disabled).toBe(true);
		fireEvent.change(screen.getByLabelText("Minute"), {
			target: { value: "For vetting, please." },
		});
		expect(submit.disabled).toBe(true); // still no office chosen
		expect(mocks.forward).not.toHaveBeenCalled();
	});
});
