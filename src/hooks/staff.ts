import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as StaffApi from "@/api/staff";
import type { CreateStaffInput, UpdateStaffInput } from "@/types/staff";
import { toast } from "sonner";

export const staffKeys = {
  all: ["staff"] as const,
  lists: () => [...staffKeys.all, "list"] as const,
  list: () => [...staffKeys.lists()] as const,
  details: () => [...staffKeys.all, "detail"] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
  roles: () => [...staffKeys.all, "roles"] as const,
};

// Get roles
export function useRoles() {
  return useQuery({
    queryKey: staffKeys.roles(),
    queryFn: StaffApi.getRoles,
    staleTime: 1000 * 60 * 60, // 1 hour - roles don't change often
  });
}

// List staff
export function useStaff() {
  return useQuery({
    queryKey: staffKeys.list(),
    queryFn: StaffApi.listStaff,
  });
}

// Get staff by ID
export function useStaffById(id: string) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => StaffApi.getStaffById(id),
    enabled: !!id,
  });
}

// Create staff
export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStaffInput) => StaffApi.createStaff(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.lists() });
      toast.success("Staff member created successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create staff member");
    },
  });
}

// Update staff
export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStaffInput }) =>
      StaffApi.updateStaff(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: staffKeys.lists() });
      qc.invalidateQueries({ queryKey: staffKeys.detail(variables.id) });
      toast.success("Staff member updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update staff member");
    },
  });
}

// Deactivate staff
export function useDeactivateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StaffApi.deactivateStaff(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: staffKeys.lists() });
      toast.success("Staff member deactivated successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to deactivate staff member");
    },
  });
}
