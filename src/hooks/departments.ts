import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type AssignHODRequest,
	assignHOD,
	type CreateDepartmentRequest,
	createDepartment,
  updateDepartment,
  deleteDepartment,
  type UpdateDepartmentRequest,
	getDepartmentTree,
	type ListDepartmentsParams,
	listDepartments,
} from "@/api/departments";

export function useDepartments(params: ListDepartmentsParams = {}) {
	return useQuery({
		queryKey: ["departments", params],
		queryFn: () => listDepartments(params),
	});
}

export function useDepartmentTree(organizationId?: string) {
	return useQuery({
		queryKey: ["departments", "tree", organizationId],
		queryFn: () => getDepartmentTree(organizationId),
	});
}

export function useCreateDepartment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateDepartmentRequest) => createDepartment(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			queryClient.invalidateQueries({ queryKey: ["departments", "tree"] });
			toast.success("Department created successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to create department");
		},
	});
}

export function useAssignHOD() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: AssignHODRequest }) =>
			assignHOD(id, input),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			if (data) {
				queryClient.setQueryData(["departments", data.id], data);
			}
			toast.success("HOD assigned successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to assign HOD");
		},
	});
}

export function useUpdateDepartment(id: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateDepartmentRequest) => updateDepartment(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments", "tree"] });
			toast.success("Department updated successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to update department");
		},
	});
}

export function useDeleteDepartment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: string) => deleteDepartment(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments", "tree"] });
			toast.success("Department deleted successfully");
		},
		onError: (error: any) => {
			toast.error(error.message || "Failed to delete department");
		},
	});
}
