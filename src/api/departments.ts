import type {
	Department,
	DepartmentFormData,
	DepartmentLevel,
	DepartmentListResponse,
	DepartmentTreeNode,
} from "@/types/department";
import { api } from "./client";

export type ListDepartmentsParams = {
	page?: number;
	limit?: number;
	search?: string;
	organizationId?: string;
	parentDepartmentId?: string;
	departmentLevel?: DepartmentLevel;
};

export async function listDepartments(
	params: ListDepartmentsParams = {},
): Promise<DepartmentListResponse> {
	const res = await api.get("/departments", { params });
	const payload = (res.data) as DepartmentListResponse;
	return payload;
}

export async function getDepartmentTree(
	organizationId?: string,
): Promise<DepartmentTreeNode[]> {
	const res = await api.get("/departments/tree", {
		params: { organizationId },
	});
	const payload = (res.data?.data ?? res.data) as DepartmentTreeNode[];
	return payload;
}

export async function getDepartment(id: string): Promise<Department> {
	const res = await api.get(`/departments/${id}`);
	const payload = (res.data?.data ?? res.data) as Department;
	return payload;
}

export type CreateDepartmentRequest = {
	name: string;
	code: string;
	organizationId: string;
	departmentLevel: DepartmentLevel;
	parentDepartmentId?: string | null;
	hodUserId?: string | null;
	locationDetails?: string | null;
	airportCode?: string | null;
	terminalCodes?: string | null;
	description?: string | null;
	isRegistry?: boolean;
};

export type UpdateDepartmentRequest = {
	name?: string;
	code?: string;
	parentDepartmentId?: string | null;
	hodUserId?: string | null;
	locationDetails?: string | null;
	airportCode?: string | null;
	terminalCodes?: string | null;
	description?: string | null;
	isRegistry?: boolean;
};

export type AssignHODRequest = {
	hodUserId: string;
};

export async function createDepartment(
	input: CreateDepartmentRequest,
): Promise<Department> {
	const res = await api.post("/departments", input);
	const payload = (res.data?.data ?? res.data) as Department;
	return payload;
}

export async function updateDepartment(
	id: string,
	input: UpdateDepartmentRequest,
): Promise<Department> {
	const res = await api.patch(`/departments/${id}`, input);
	const payload = (res.data?.data ?? res.data) as Department;
	return payload;
}

export async function assignHOD(
	id: string,
	input: AssignHODRequest,
): Promise<Department> {
	const res = await api.patch(`/departments/${id}/hod`, input);
	const payload = (res.data?.data ?? res.data) as Department;
	return payload;
}

export async function deleteDepartment(id: string): Promise<void> {
	await api.delete(`/departments/${id}`);
}

export async function getUnitsByDepartment(departmentId: string): Promise<{data: Department[]}> {
	const res = await api.get(`/departments/${departmentId}/units`);
	const payload = (res.data) as {data: Department[]};
	return payload;
}

export async function listUnits(params: { departmentId?: string } = {}): Promise<Department[]> {
	const res = await api.get("/units", { params });
	const payload = (res.data?.data ?? res.data) as Department[];
	return payload;
}

// Helper to prepare form data for API request
export function prepareCreateRequest(
	formData: DepartmentFormData,
	organizationId: string,
): CreateDepartmentRequest {
	return {
		name: formData.name,
		code: formData.code,
		organizationId,
		departmentLevel: formData.departmentLevel,
		parentDepartmentId: formData.parentDepartmentId || null,
		hodUserId: formData.headUserId || null,
		locationDetails: formData.locationDetails || null,
		airportCode: formData.airportCode || null,
		terminalCodes: formData.terminalCodes?.length
			? JSON.stringify(formData.terminalCodes)
			: null,
		description: formData.description || null,
		isRegistry: formData.isRegistry || false,
	};
}
