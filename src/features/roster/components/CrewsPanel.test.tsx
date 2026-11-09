// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: any) => children }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/stores/auth", () => ({
	useAuthStore: (selector: any) => selector({ user: { role: "org_admin" } }),
}));
vi.mock("@/api/messaging", () => ({ addGroupMember: vi.fn() }));
vi.mock("@/components/staff/ColleaguePicker", () => ({ ColleaguePicker: () => null }));
vi.mock("@/hooks/geofence", () => ({ useZoneLabel: () => "Test zone" }));
vi.mock("@/features/roster/api", () => ({
	useGetShiftPatterns: () => ({ data: [], isError: false }),
}));
vi.mock("@/features/roster/crews", () => ({
	addCrewMember: vi.fn(),
	addDays: vi.fn(),
	applyCrewPattern: vi.fn(),
	createCrew: vi.fn(),
	createCrewChat: vi.fn(),
	crewShiftOn: vi.fn(),
	crewsByShift: vi.fn(() => ({})),
	listCrewMembers: vi.fn(),
	listCrews: vi.fn(),
	removeCrewMember: vi.fn(),
	todayLocal: () => "2026-11-09",
}));
vi.mock("@/components/departments/DepartmentSelector", () => ({
	DepartmentSelector: (props: any) => (
		<div
			data-testid="department-selector"
			data-placeholder={props.placeholder}
			data-filter-level={props.filterLevel}
			data-max-level={props.maxLevel}
		/>
	),
}));

import { CrewsPanel } from "./CrewsPanel";

describe("CrewsPanel", () => {
	it("allows selecting departments and operational units", () => {
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(
			<QueryClientProvider client={client}>
				<CrewsPanel />
			</QueryClientProvider>,
		);

		const selector = screen.getByTestId("department-selector");
		expect(selector.getAttribute("data-placeholder")).toBe("Choose a department or unit");
		expect(selector.getAttribute("data-max-level")).toBe("2");
		expect(selector.getAttribute("data-filter-level")).not.toBe("1");
	});
});
