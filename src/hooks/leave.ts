import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyLeaveBalances, getMyApplications, applyForLeave, getPendingApprovals, processApproval } from "@/api/leave";
import type { ApprovalLevel, CreateLeaveRequest } from "@/types/leave";
import { getRoles, ROLE_GROUPS } from "@/lib/access";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

export function useMyLeaveBalances() {
  return useQuery({
    queryKey: ["leave-balances"],
    queryFn: getMyLeaveBalances,
  });
}

export function useMyApplications() {
  return useQuery({
    queryKey: ["my-applications"],
    queryFn: getMyApplications,
  });
}

export function useApplyForLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateLeaveRequest) => applyForLeave(data),
    onSuccess: () => {
      toast.success("Leave application submitted successfully!");
      queryClient.invalidateQueries({ queryKey: ["my-applications"] });
      queryClient.invalidateQueries({ queryKey: ["leave-balances"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit application");
    },
  });
}

// Manager Hooks

/** Approval levels this user can act at, from their roles. */
export function approvalLevelsFor(user: Parameters<typeof getRoles>[0]): ApprovalLevel[] {
    const roles = getRoles(user);
    const levels: ApprovalLevel[] = [];
    if (roles.some((r) => ["SUPERVISOR", "HOU"].includes(r))) levels.push("supervisor");
    if (roles.some((r) => ["HOD", "ACOS", "RGM"].includes(r))) levels.push("hod");
    if (roles.some((r) => ["HR"].includes(r))) levels.push("hr");
    // Administrators can see and act at every level.
    if (roles.some((r) => (ROLE_GROUPS.admins as readonly string[]).includes(r))) return ["supervisor", "hod", "hr"];
    return levels;
}

export function usePendingApprovals() {
    const user = useAuthStore((s) => s.user);
    const levels = approvalLevelsFor(user);
    return useQuery({
        queryKey: ["pending-approvals", levels],
        queryFn: () => getPendingApprovals(levels),
        enabled: levels.length > 0,
    });
}

export function useProcessApproval() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            level,
            decision,
            comments,
        }: {
            id: string;
            level: ApprovalLevel;
            decision: "approve" | "reject";
            comments?: string;
        }) => processApproval(id, level, decision, comments),
        onSuccess: (_, v) => {
            toast.success(v.decision === "approve" ? "Leave approved" : "Leave rejected");
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to process application");
        }
    })
}
