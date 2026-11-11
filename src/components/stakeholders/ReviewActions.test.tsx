// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock("@/hooks/stakeholder-portal", () => ({
	useReviewStakeholderActivity: () => ({
		mutate: mocks.mutate,
		isPending: false,
		variables: undefined,
	}),
	useReviewStakeholderInvoice: vi.fn(),
	useItemTrail: () => ({ data: null, isLoading: false, isError: false }),
	useForwardItem: () => ({ mutate: vi.fn(), isPending: false }),
	useReturnItem: () => ({ mutate: vi.fn(), isPending: false }),
	useAcknowledgeItem: () => ({ mutate: vi.fn(), isPending: false }),
	useStakeholderInvoices: vi.fn(),
}));
vi.mock("@/hooks/departments", () => ({ useDepartmentTree: () => ({ data: [] }) }));
vi.mock("@/hooks/positions", () => ({ usePositions: () => ({ data: [] }) }));
vi.mock("@/hooks/users", () => ({ useDepartmentStaff: () => ({ data: [] }) }));
vi.mock("./documents/useDocumentFileViewer", () => ({ useDocumentFileViewer: () => ({ open: vi.fn(), loadingId: null, viewer: null }) }));
vi.mock("@/stores/auth", () => ({
	useAuthStore: (selector: any) =>
		selector({ user: { role: "org_admin", canManageStakeholders: true } }),
}));

import { ActivitiesReviewTab } from "./ReviewActions";

describe("ActivitiesReviewTab", () => {
	beforeEach(() => vi.clearAllMocks());

	it("offers approve and reject actions for a submitted partner activity", () => {
		render(
			<ActivitiesReviewTab
				stakeholderOrgId="org-1"
				activities={[
					{
						id: "activity-1",
						activityTitle: "Airside support",
						activityType: "ground_handling",
						activityReference: "ACT-001",
						status: "submitted",
						createdAt: "2026-11-09T08:00:00.000Z",
					} as any,
				]}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "Approve" }));
		expect(mocks.mutate).toHaveBeenCalledWith({
			activityId: "activity-1",
			status: "approved",
		});
		expect(screen.getByRole("button", { name: "Reject" })).not.toBeNull();
	});
});
