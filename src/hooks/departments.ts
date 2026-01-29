import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type AssignHODRequest,
	assignHOD,
	type CreateDepartmentRequest,
	createDepartment,
	getDepartment,
	getDepartmentTree,
	type ListDepartmentsParams,
	listDepartments,
	updateDepartment,
	deleteDepartment,
	type UpdateDepartmentRequest,
	getUnitsByDepartment,
	listUnits,
} from "@/api/departments";

export function useDepartments(params: ListDepartmentsParams = {}) {
	return useQuery({
		queryKey: ["departments", params],
		queryFn: () => listDepartments(params),
	});
}

export function useDepartment(id: string) {
	return useQuery({
		queryKey: ["departments", id],
		queryFn: () => getDepartment(id),
		enabled: !!id,
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

export function useUpdateDepartment(id: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateDepartmentRequest) => updateDepartment(id, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["departments"] });
			queryClient.invalidateQueries({ queryKey: ["departments", "tree"] });
			queryClient.invalidateQueries({ queryKey: ["departments", id] });
			toast.success("Department updated successfully");
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to update department");
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
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to delete department");
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
			queryClient.invalidateQueries({ queryKey: ["departments", "tree"] });
			if (data) {
				queryClient.setQueryData(["departments", data.id], data);
				const role = data.departmentLevel === 2 ? "Head of Unit" : "Head of Department";
				toast.success(`${role} assigned successfully`);
			} else {
				toast.success("Head assigned successfully");
			}
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error
					? error.message
					: typeof error === "object" && error && "message" in error
						? String((error as { message?: unknown }).message ?? "")
						: "";
			toast.error(message || "Failed to assign head");
		},
	});
}

export function useDepartmentUnits(departmentId: string) {
	return useQuery({
		queryKey: ["departments", departmentId, "units"],
		queryFn: () => getUnitsByDepartment(departmentId),
		enabled: !!departmentId,
	});
}

export function useUnits(params: { departmentId?: string } = {}) {
	return useQuery({
		queryKey: ["units", params],
		queryFn: () => listUnits(params),
	});
}
