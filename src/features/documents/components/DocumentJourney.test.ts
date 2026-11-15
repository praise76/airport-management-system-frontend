import { describe, expect, it, vi } from "vitest";

vi.mock("@/api/client", () => ({ api: { post: vi.fn(async () => ({ data: {} })), get: vi.fn() } }));

import { api } from "@/api/client";
import { rgmSendToDepartments } from "@/api/documents";
import { assignTask } from "@/api/tasks";
import { stepLabel } from "./DocumentJourney";

describe("stepLabel", () => {
	it("turns server step names into plain words", () => {
		expect(stepLabel({ action: "sent_on_by_hod", status: "completed", location: "" })).toBe("Sent on by the Head of Department");
		expect(stepLabel({ action: "memo_sent", status: "completed", location: "" })).toBe("Memo sent to the Head of Department");
		expect(stepLabel({ action: "some_new_step", status: "completed", location: "" })).toBe("Some new step");
	});
	it("names who a pending step is waiting with instead of 'Step 3'", () => {
		expect(stepLabel({ action: "", status: "pending", location: "HOD - Environmental Services" })).toBe("Waiting with HOD - Environmental Services");
	});
});

describe("rgmSendToDepartments", () => {
	it("sends the files with the first department only", async () => {
		const post = vi.mocked(api.post);
		post.mockClear();
		await rgmSendToDepartments("d1", { departmentIds: ["eng", "fin"], comments: "go", attachmentIds: ["f1"] });
		expect(post.mock.calls.map((c) => c[1])).toEqual([
			{ targetDeptId: "eng", comments: "go", attachmentIds: ["f1"] },
			{ targetDeptId: "fin", comments: "go" },
		]);
	});
});

describe("assignTask", () => {
	it("sends the assignee the way the server reads it", async () => {
		const post = vi.mocked(api.post);
		post.mockClear();
		post.mockResolvedValueOnce({ data: { data: {} } } as never);
		await assignTask("t1", { userId: "u1" });
		expect(post).toHaveBeenCalledWith("/tasks/t1/assign", { userId: "u1", assigneeUserId: "u1" });
	});
});
