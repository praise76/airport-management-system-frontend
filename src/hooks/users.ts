import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as UsersApi from "@/api/users";
import { toast } from "sonner";

export function useUsers(params?: { page?: number; limit?: number; role?: string; departmentId?: string }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => UsersApi.listUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => UsersApi.getUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof UsersApi.updateUser>[1]) => UsersApi.updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      qc.invalidateQueries({ queryKey: ["users", id] });
      toast.success("User updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update user");
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UsersApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete user");
    },
  });
}
