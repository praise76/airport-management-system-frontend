import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
import { getAttendanceSummary } from "./attendance";

vi.mock("./client", () => ({
	api: { get: vi.fn() },
}));

describe("attendance dashboard summary", () => {
	beforeEach(() => vi.clearAllMocks());

	it("unwraps the API envelope and exposes the fields used by the dashboard", async () => {
		vi.mocked(api.get).mockResolvedValue({
			data: {
				success: true,
				data: {
					activeUsers: 4,
					checkedInToday: 1,
					checkedIn: 4,
					totalEmployees: 46,
					absent: 40,
					onLeave: 2,
				},
			},
		} as any);

		await expect(getAttendanceSummary()).resolves.toMatchObject({
			checkedIn: 4,
			totalEmployees: 46,
			absent: 40,
			onLeave: 2,
		});
	});

	it("keeps the dashboard useful with the older activeUsers response", async () => {
		vi.mocked(api.get).mockResolvedValue({
			data: { success: true, data: { activeUsers: 4, checkedInToday: 1 } },
		} as any);

		await expect(getAttendanceSummary()).resolves.toMatchObject({
			checkedIn: 4,
			totalEmployees: 4,
			absent: 0,
			onLeave: 0,
		});
	});
});
