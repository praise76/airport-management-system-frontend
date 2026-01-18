import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as GroupsApi from "@/api/groups";
import { toast } from "sonner";

export function useGroups(params?: { departmentId?: string; groupType?: string; visibility?: string }) {
  return useQuery({
    queryKey: ["groups", params],
    queryFn: () => GroupsApi.listGroups(params),
  });
}

export function useCreateGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof GroupsApi.createGroup>[0]) => GroupsApi.createGroup(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create group");
    },
  });
}

export function useAddGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof GroupsApi.addGroupMember>[1]) => GroupsApi.addGroupMember(groupId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] }); // Assuming we might fetch members someday
      toast.success("Member added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });
}

export function useRemoveGroupMember(groupId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => GroupsApi.removeGroupMember(groupId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["groups", groupId, "members"] });
      toast.success("Member removed successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
}
