// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
const state = vi.hoisted(() => ({
  user: { userId: "acting-person", role: "supervisor" },
  permissions: { leaveApprovalLevels: ["supervisor", "hod"] as any, isLoading: false, error: null },
  pending: vi.fn(async () => []),
}));
vi.mock("@/stores/auth", () => ({ useAuthStore: (select: any) => select({ user: state.user }) }));
vi.mock("@/hooks/usePermissions", () => ({ usePermissions: () => state.permissions }));
vi.mock("@/api/leave", () => ({
  getPendingApprovals: state.pending,
  getMyLeaveBalances: vi.fn(), getMyApplications: vi.fn(), applyForLeave: vi.fn(), processApproval: vi.fn(),
}));
import { usePendingApprovals } from "./leave";
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
describe("acting HOD leave queues", () => {
  beforeEach(() => {
    state.pending.mockClear();
    state.user.role = "supervisor";
    state.permissions = { leaveApprovalLevels: ["supervisor", "hod"], isLoading: false, error: null };
  });
  afterEach(cleanup);
  it("loads the HOD queue as well as the acting person's supervisor queue", async () => {
    renderHook(usePendingApprovals, { wrapper });
    await waitFor(() => expect(state.pending).toHaveBeenCalledWith(["supervisor", "hod"]));
  });
  it("loads the HOD queue for an officer with a live acting assignment", async () => {
    state.user.role = "officer";
    state.permissions.leaveApprovalLevels = ["hod"];
    renderHook(usePendingApprovals, { wrapper });
    await waitFor(() => expect(state.pending).toHaveBeenCalledWith(["hod"]));
  });
  it("does not fall back to permanent role permissions after authority is withdrawn", () => {
    state.permissions.leaveApprovalLevels = [];
    const { result } = renderHook(usePendingApprovals, { wrapper });
    expect(result.current.levels).toEqual([]);
    expect(state.pending).not.toHaveBeenCalled();
  });
  it("waits for the server's current authority before fetching queues", () => {
    state.permissions.isLoading = true;
    const { result } = renderHook(usePendingApprovals, { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(state.pending).not.toHaveBeenCalled();
  });
});
