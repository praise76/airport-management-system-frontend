import { api } from "./client";
import type {
	StakeholderOrganization,
	StakeholderOrgListParams,
	StakeholderOrgListResponse,
	CreateStakeholderOrgInput,
	UpdateStakeholderOrgInput,
	StakeholderUser,
	StakeholderActivity,
	StakeholderPermit,
	StakeholderFlight,
	StakeholderInvoice,
	CreateActivityInput,
	CreatePermitInput,
	CreateFlightInput,
	CreateInvoiceInput,
	StakeholderAuthLoginInput,
	StakeholderAuthLoginResponse,
	StakeholderRegistrationInput,
	StakeholderStats,
} from "@/types/stakeholder-portal";

// ============================================
// STAKEHOLDER ORGANIZATIONS (Admin)
// ============================================

export async function listStakeholderOrgs(
	params: StakeholderOrgListParams = {},
): Promise<StakeholderOrgListResponse> {
	const res = await api.get("/stakeholder-orgs", { params });
	// Backend returns { success: true, data: { items: [...], pagination: {...} } }
	const responseData = res.data.data ?? res.data;
	return {
		data: responseData.items ?? responseData,
		pagination: responseData.pagination ?? {
			page: 1,
			limit: 20,
			total: 0,
			totalPages: 0,
		},
	};
}

export async function getStakeholderOrgStats(): Promise<StakeholderStats> {
	const res = await api.get("/stakeholder-orgs/stats");
	return res.data.data ?? res.data;
}

export async function getStakeholderOrg(id: string): Promise<StakeholderOrganization> {
	const res = await api.get(`/stakeholder-orgs/${id}`);
	return res.data.data ?? res.data;
}

export async function createStakeholderOrg(
	input: CreateStakeholderOrgInput,
): Promise<StakeholderOrganization> {
	const res = await api.post("/stakeholder-orgs", input);
	return res.data.data ?? res.data;
}

export async function updateStakeholderOrg(
	id: string,
	input: UpdateStakeholderOrgInput,
): Promise<StakeholderOrganization> {
	const res = await api.patch(`/stakeholder-orgs/${id}`, input);
	return res.data.data ?? res.data;
}

export async function verifyStakeholderOrg(
	id: string,
	data: {
		verificationNotes?: string;
		verificationExpiry?: string;
		accreditationLevel?: "bronze" | "silver" | "gold" | "platinum";
	},
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/verify`, data);
	return res.data.data ?? res.data;
}

export async function suspendStakeholderOrg(
	id: string,
	data: { reason: string; suspensionEnd?: string },
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/suspend`, data);
	return res.data.data ?? res.data;
}

export async function blacklistStakeholderOrg(
	id: string,
	data: { reason: string },
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/blacklist`, data);
	return res.data.data ?? res.data;
}

export async function reactivateStakeholderOrg(
	id: string,
): Promise<StakeholderOrganization> {
	const res = await api.post(`/stakeholder-orgs/${id}/reactivate`);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER USERS
// ============================================

export async function listStakeholderUsers(
	stakeholderOrgId: string,
): Promise<StakeholderUser[]> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/users`);
	const data = res.data.data ?? res.data;
	return data.items ?? data;
}

export async function createStakeholderUser(
	stakeholderOrgId: string,
	input: Omit<StakeholderUser, "id" | "createdAt" | "lastLogin" | "stakeholderOrganizationId"> & { password: string },
): Promise<StakeholderUser> {
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/users`, {
		stakeholderOrganizationId: stakeholderOrgId,
		...input,
	});
	return res.data.data ?? res.data;
}

export async function updateStakeholderUser(
	stakeholderOrgId: string,
	userId: string,
	input: Partial<StakeholderUser>,
): Promise<StakeholderUser> {
	const res = await api.patch(`/stakeholder-orgs/${stakeholderOrgId}/users/${userId}`, input);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER ACTIVITIES
// ============================================

export async function listStakeholderActivities(
	stakeholderOrgId: string,
	params: {
		status?: string;
		activityType?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderActivity[]; pagination: any }> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/activities`, { params });
	const responseData = res.data.data ?? res.data;
	return {
		data: responseData.items ?? responseData ?? [],
		pagination: responseData.pagination,
	};
}

export async function getStakeholderActivity(
	stakeholderOrgId: string,
	activityId: string,
): Promise<StakeholderActivity> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/activities/${activityId}`);
	return res.data.data ?? res.data;
}

export async function createStakeholderActivity(
	stakeholderOrgId: string,
	input: CreateActivityInput,
): Promise<StakeholderActivity> {
	// stakeholderOrganizationId is derived from URL path
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/activities`, input);
	return res.data.data ?? res.data;
}

export async function submitStakeholderActivity(
	stakeholderOrgId: string,
	activityId: string,
): Promise<StakeholderActivity> {
	const res = await api.post(
		`/stakeholder-orgs/${stakeholderOrgId}/activities/${activityId}/submit`,
	);
	return res.data.data ?? res.data;
}

export async function reviewStakeholderActivity(
	stakeholderOrgId: string,
	activityId: string,
	status: "approved" | "rejected",
	reviewComments?: string,
): Promise<StakeholderActivity> {
	const res = await api.post(
		`/stakeholder-orgs/${stakeholderOrgId}/activities/${activityId}/review`,
		{ status, reviewComments },
	);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER PERMITS
// ============================================

export async function listStakeholderPermits(
	stakeholderOrgId: string,
	params: {
		status?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderPermit[]; pagination: any }> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/permits`, { params });
	const responseData = res.data.data ?? res.data;
	return {
		data: responseData.items ?? responseData ?? [],
		pagination: responseData.pagination,
	};
}

export async function createStakeholderPermit(
	stakeholderOrgId: string,
	input: CreatePermitInput,
): Promise<StakeholderPermit> {
	// stakeholderOrganizationId is derived from URL path
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/permits`, input);
	return res.data.data ?? res.data;
}

export async function approveStakeholderPermit(
	stakeholderOrgId: string,
	permitId: string,
): Promise<StakeholderPermit> {
	const res = await api.post(
		`/stakeholder-orgs/${stakeholderOrgId}/permits/${permitId}/approve`,
	);
	return res.data.data ?? res.data;
}

export async function rejectStakeholderPermit(
	stakeholderOrgId: string,
	permitId: string,
	reason: string,
): Promise<StakeholderPermit> {
	const res = await api.post(
		`/stakeholder-orgs/${stakeholderOrgId}/permits/${permitId}/reject`,
		{ reason },
	);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER FLIGHTS (Airline-specific)
// ============================================

export async function listStakeholderFlights(
	stakeholderOrgId: string,
	params: {
		date?: string;
		flightStatus?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderFlight[]; pagination: any }> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/flights`, { params });
	const responseData = res.data.data ?? res.data;
	return {
		data: responseData.items ?? responseData ?? [],
		pagination: responseData.pagination,
	};
}

export async function createStakeholderFlight(
	stakeholderOrgId: string,
	input: CreateFlightInput,
): Promise<StakeholderFlight> {
	// stakeholderOrganizationId is derived from URL path
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/flights`, input);
	return res.data.data ?? res.data;
}

export async function updateStakeholderFlight(
	stakeholderOrgId: string,
	flightId: string,
	input: Partial<CreateFlightInput & { flightStatus: string; gate: string; parkingStand: string }>,
): Promise<StakeholderFlight> {
	const res = await api.patch(
		`/stakeholder-orgs/${stakeholderOrgId}/flights/${flightId}`,
		input,
	);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER INVOICES
// ============================================

export async function listStakeholderInvoices(
	stakeholderOrgId: string,
	params: {
		paymentStatus?: string;
		reviewStatus?: string;
		page?: number;
		limit?: number;
	} = {},
): Promise<{ data: StakeholderInvoice[]; pagination: any }> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/invoices`, { params });
	const responseData = res.data.data ?? res.data;
	return {
		data: responseData.items ?? responseData ?? [],
		pagination: responseData.pagination,
	};
}

export async function createStakeholderInvoice(
	stakeholderOrgId: string,
	input: CreateInvoiceInput,
): Promise<StakeholderInvoice> {
	// stakeholderOrganizationId is derived from URL path
	const res = await api.post(`/stakeholder-orgs/${stakeholderOrgId}/invoices`, input);
	return res.data.data ?? res.data;
}

export async function reviewStakeholderInvoice(
	stakeholderOrgId: string,
	invoiceId: string,
	reviewStatus: "approved" | "rejected",
	reviewComments?: string,
): Promise<StakeholderInvoice> {
	const res = await api.post(
		`/stakeholder-orgs/${stakeholderOrgId}/invoices/${invoiceId}/review`,
		{ reviewStatus, reviewComments },
	);
	return res.data.data ?? res.data;
}

// ============================================
// STAKEHOLDER AUTH (Portal)
// ============================================

export async function stakeholderLogin(
	input: StakeholderAuthLoginInput,
): Promise<StakeholderAuthLoginResponse> {
	const res = await api.post("/stakeholder-auth/login", input);
	return res.data.data ?? res.data;
}

export async function stakeholderRegister(
	input: StakeholderRegistrationInput,
): Promise<{ success: boolean; message: string; data: StakeholderOrganization }> {
	const res = await api.post("/stakeholder-auth/register", input);
	return res.data;
}

export async function stakeholderForgotPassword(
	email: string,
): Promise<{ success: boolean; message: string }> {
	const res = await api.post("/stakeholder-auth/forgot-password", { email });
	return res.data;
}

export async function stakeholderResetPassword(
	token: string,
	newPassword: string,
): Promise<{ success: boolean; message: string }> {
	const res = await api.post("/stakeholder-auth/reset-password", {
		token,
		newPassword,
	});
	return res.data;
}

// ============================================
// STAKEHOLDER DASHBOARD DATA
// ============================================

export async function getStakeholderDashboard(
	stakeholderOrgId: string,
): Promise<{
	stats: Record<string, number>;
	recentActivities: StakeholderActivity[];
	activePermits: StakeholderPermit[];
	upcomingFlights?: StakeholderFlight[];
	pendingInvoices?: StakeholderInvoice[];
}> {
	const res = await api.get(`/stakeholder-orgs/${stakeholderOrgId}/dashboard`);
	return res.data.data ?? res.data;
}
