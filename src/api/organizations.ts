import type {
	Organization,
	OrganizationListResponse,
} from "@/types/organization";
import { api } from "./client";

export type ListOrganizationsParams = {
	page?: number;
	limit?: number;
};

export async function listOrganizations(
	params: ListOrganizationsParams = {},
): Promise<OrganizationListResponse> {
	const res = await api.get("/organizations", { params });
	const payload = res.data as OrganizationListResponse;
	return payload;
}

export async function getOrganization(id: string): Promise<Organization> {
	const res = await api.get(`/organizations/${id}`);
	const payload = (res.data?.data ?? res.data) as Organization;
	return payload;
}

export type CreateOrganizationRequest = {
	name: string;
	code: string;
	address: string;
};

export type UpdateOrganizationRequest = {
	name?: string;
	code?: string;
	address?: string;
};

export async function createOrganization(
	input: CreateOrganizationRequest,
): Promise<Organization> {
	const res = await api.post("/organizations", input);
	const payload = (res.data?.data ?? res.data) as Organization;
	return payload;
}

export async function updateOrganization(
	id: string,
	input: UpdateOrganizationRequest,
): Promise<Organization> {
	const res = await api.patch(`/organizations/${id}`, input);
	const payload = (res.data?.data ?? res.data) as Organization;
	return payload;
}
