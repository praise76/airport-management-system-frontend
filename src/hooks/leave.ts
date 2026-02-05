import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyLeaveBalances, getMyApplications, applyForLeave, getPendingApprovals, processApproval } from "@/api/leave";
import { CreateLeaveRequest } from "@/types/leave";
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
export function usePendingApprovals() {
    return useQuery({
        queryKey: ["pending-approvals"],
        queryFn: getPendingApprovals,
    });
}

export function useProcessApproval() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status, comments }: { id: string; status: "approved" | "rejected"; comments?: string }) => 
            processApproval(id, status, comments),
        onSuccess: () => {
            toast.success("Application processed successfully");
            queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to process application");
        }
    })
}
