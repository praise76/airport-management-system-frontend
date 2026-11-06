import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./client";
import { getTasks } from "./tasks";

vi.mock("./client", () => ({ api: { get: vi.fn() } }));

describe("task list API contract", () => {
	const task = { id: "task-1", title: "Visible task", status: "open" };

	beforeEach(() => vi.clearAllMocks());

	it("wraps the API task array for the page", async () => {
		vi.mocked(api.get).mockResolvedValue({
			data: { success: true, data: [task] },
		});

		const result = await getTasks({ status: "open" });

		expect(result.data).toEqual([task]);
		expect(api.get).toHaveBeenCalledWith("/tasks", {
			params: { status: "open" },
		});
	});

	it("preserves a paginated payload", async () => {
		const payload = {
			data: [task],
			pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
		};
		vi.mocked(api.get).mockResolvedValue({ data: { data: payload } });

		expect(await getTasks()).toEqual(payload);
	});

	it("distinguishes an empty result from a malformed response", async () => {
		vi.mocked(api.get).mockResolvedValue({ data: { data: [] } });
		expect((await getTasks()).data).toEqual([]);

		vi.mocked(api.get).mockResolvedValue({ data: { data: {} } });
		await expect(getTasks()).rejects.toThrow("invalid task list");
	});
});
