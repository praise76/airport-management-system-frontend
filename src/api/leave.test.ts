import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
import { getPendingApprovals, processApproval } from "./leave";

vi.mock("./client", () => ({ api: { get: vi.fn(), post: vi.fn() } }));

describe("leave review payload (QA LV-01)", () => {
	beforeEach(() => vi.clearAllMocks());

	it("sends approved alongside decision so either backend version accepts it", async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: { id: "l1", status: "approved" } } });
		await processApproval("l1", "hod", "approve", "  ok  ");
		expect(api.post).toHaveBeenCalledWith("/self-service/leave/l1/review/hod", {
			decision: "approve",
			approved: true,
			comments: "ok",
		});
	});

	it("maps reject to approved: false and drops empty comments", async () => {
		vi.mocked(api.post).mockResolvedValue({ data: { data: {} } });
		await processApproval("l2", "supervisor", "reject", "   ");
		expect(api.post).toHaveBeenCalledWith("/self-service/leave/l2/review/supervisor", {
			decision: "reject",
			approved: false,
			comments: undefined,
		});
	});
});

describe("pending approvals (QA LV-02)", () => {
	beforeEach(() => vi.clearAllMocks());

	it("reports a refused queue instead of showing nothing to approve", async () => {
		vi.mocked(api.get).mockRejectedValue({ status: 403, message: "Forbidden" });
		await expect(getPendingApprovals(["hod"])).rejects.toMatchObject({
			status: 403,
			code: "APPROVAL_QUEUE_FORBIDDEN",
		});
	});

	it("still returns the levels that loaded when only some are refused (admins ask for all)", async () => {
		vi.mocked(api.get).mockImplementation(async (url: string) => {
			if (url.endsWith("/hr")) throw { status: 403 };
			return {
				data: {
					data: [
						{ id: "a", leaveType: "annual", startDate: "2026-11-11", endDate: "2026-11-12", user: { firstName: "Emeka", lastName: "Eze" }, createdAt: "2026-11-08" },
					],
				},
			};
		});
		const list = await getPendingApprovals(["supervisor", "hr"]);
		expect(list).toHaveLength(1);
		expect(list[0].staffName).toBe("Emeka Eze");
	});
});
