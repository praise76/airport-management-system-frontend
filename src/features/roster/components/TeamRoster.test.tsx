// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/api/client";

vi.mock("@/api/client", () => ({ api: { get: vi.fn() } }));
vi.mock("@/hooks/geofence", () => ({ useZoneLabel: () => () => undefined }));
vi.mock("@/features/roster/useCrewMap", () => ({
	useCrewMap: () => new Map([["staff-1", "Screening Crew B"]]),
	byCrew: (a?: string, b?: string) => (a ?? "").localeCompare(b ?? ""),
}));

import { TeamRoster } from "./TeamRoster";

describe("TeamRoster", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers({ shouldAdvanceTime: true });
		vi.setSystemTime(new Date("2026-11-10T10:00:00+01:00"));
	});
	afterEach(() => vi.useRealTimers());

	it("shows the unit's published roster and crew, not only personal shifts", async () => {
		vi.mocked(api.get).mockImplementation(async (url: string) => {
			if (url.startsWith("/roster?unitDepartmentId=")) {
				return {
					data: {
						data: [
							{
								id: "roster-1",
								rosterName: "AVSEC Passenger Screening crews 9-16 Nov 2026",
								startDate: "2026-11-09",
								endDate: "2026-11-16",
								approvalStatus: "approved",
								unitDepartmentId: "unit-1",
							},
						],
					},
				} as any;
			}
			return {
				data: {
					data: {
						entries: [
							{
								id: "entry-1",
								staffId: "staff-1",
								dutyDate: "2026-11-10",
								shift: "morning",
								shiftStartTime: "06:00:00",
								shiftEndTime: "14:00:00",
								staff: { id: "staff-1", firstName: "Chika", lastName: "N" },
							},
						],
					},
				},
			} as any;
		});
		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

		render(
			<QueryClientProvider client={client}>
				<TeamRoster myUserId="staff-1" departmentId="unit-1" myEntries={[]} />
			</QueryClientProvider>,
		);

		expect(await screen.findByText("My team's roster")).not.toBeNull();
		expect(await screen.findByText(/Published roster: AVSEC Passenger Screening/)).not.toBeNull();
		expect((await screen.findAllByText("Screening Crew B")).length).toBeGreaterThan(0);
		expect(await screen.findByText(/Chika N/)).not.toBeNull();
	});
});
