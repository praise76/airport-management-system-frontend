import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as StakeholderPortalApi from "@/api/stakeholder-portal";
import type {
	StakeholderOrgListParams,
	CreateStakeholderOrgInput,
	UpdateStakeholderOrgInput,
	StakeholderUser,
	CreateActivityInput,
	CreatePermitInput,
	CreateFlightInput,
	CreateInvoiceInput,
	StakeholderAuthLoginInput,
	StakeholderRegistrationInput,
	AccreditationLevel,
} from "@/types/stakeholder-portal";

// ============================================
// STAKEHOLDER ORGANIZATIONS
// ============================================

export function useStakeholderOrgs(params: StakeholderOrgListParams = {}) {
	return useQuery({
		queryKey: ["stakeholder-orgs", params],
		queryFn: () => StakeholderPortalApi.listStakeholderOrgs(params),
	});
}

export function useStakeholderOrgStats() {
	return useQuery({
		queryKey: ["stakeholder-orgs", "stats"],
		queryFn: () => StakeholderPortalApi.getStakeholderOrgStats(),
	});
}

export function useStakeholderOrg(id: string) {
	return useQuery({
		queryKey: ["stakeholder-orgs", id],
		queryFn: () => StakeholderPortalApi.getStakeholderOrg(id),
		enabled: !!id,
	});
}

export function useCreateStakeholderOrg() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateStakeholderOrgInput) =>
			StakeholderPortalApi.createStakeholderOrg(input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			toast.success("Stakeholder organization created successfully");
		},
		onError: (err: any) =>
			toast.error(err.message || "Failed to create stakeholder organization"),
	});
}

export function useUpdateStakeholderOrg(id: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UpdateStakeholderOrgInput) =>
			StakeholderPortalApi.updateStakeholderOrg(id, input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs", id] });
			toast.success("Stakeholder organization updated successfully");
		},
		onError: (err: any) =>
			toast.error(err.message || "Failed to update stakeholder organization"),
	});
}

export function useVerifyStakeholderOrg() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			verificationNotes,
			verificationExpiry,
			accreditationLevel,
		}: {
			id: string;
			verificationNotes?: string;
			verificationExpiry?: string;
			accreditationLevel?: AccreditationLevel;
		}) =>
			StakeholderPortalApi.verifyStakeholderOrg(id, {
				verificationNotes,
				verificationExpiry,
				accreditationLevel,
			}),
		onSuccess: (_, { id }) => {
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs", id] });
			toast.success("Stakeholder verified successfully");
		},
		onError: (err: any) => toast.error(err.message || "Failed to verify stakeholder"),
	});
}

export function useSuspendStakeholderOrg() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			id,
			reason,
			suspensionEnd,
		}: {
			id: string;
			reason: string;
			suspensionEnd?: string;
		}) => StakeholderPortalApi.suspendStakeholderOrg(id, { reason, suspensionEnd }),
		onSuccess: (_, { id }) => {
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs", id] });
			toast.success("Stakeholder suspended successfully");
		},
		onError: (err: any) => toast.error(err.message || "Failed to suspend stakeholder"),
	});
}

export function useBlacklistStakeholderOrg() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, reason }: { id: string; reason: string }) =>
			StakeholderPortalApi.blacklistStakeholderOrg(id, { reason }),
		onSuccess: (_, { id }) => {
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs", id] });
			toast.success("Stakeholder blacklisted");
		},
		onError: (err: any) =>
			toast.error(err.message || "Failed to blacklist stakeholder"),
	});
}

export function useReactivateStakeholderOrg() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => StakeholderPortalApi.reactivateStakeholderOrg(id),
		onSuccess: (_, id) => {
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs", id] });
			toast.success("Stakeholder reactivated successfully");
		},
		onError: (err: any) =>
			toast.error(err.message || "Failed to reactivate stakeholder"),
	});
}

// ============================================
// STAKEHOLDER USERS
// ============================================

export function useStakeholderUsers(stakeholderOrgId: string) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "users"],
		queryFn: () => StakeholderPortalApi.listStakeholderUsers(stakeholderOrgId),
		enabled: !!stakeholderOrgId,
	});
}

export function useCreateStakeholderUser(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (
			input: Omit<StakeholderUser, "id" | "createdAt" | "lastLogin"> & { password: string },
		) => StakeholderPortalApi.createStakeholderUser(stakeholderOrgId, input),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "users"],
			});
			toast.success("User added successfully");
		},
		onError: (err: any) => toast.error(err.message || "Failed to add user"),
	});
}

// ============================================
// STAKEHOLDER ACTIVITIES
// ============================================

export function useStakeholderActivities(
	stakeholderOrgId: string,
	params: {
		status?: string;
		activityType?: string;
		page?: number;
		limit?: number;
	} = {},
) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "activities", params],
		queryFn: () => StakeholderPortalApi.listStakeholderActivities(stakeholderOrgId, params),
		enabled: !!stakeholderOrgId,
	});
}

export function useStakeholderActivity(stakeholderOrgId: string, activityId: string) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "activities", activityId],
		queryFn: () => StakeholderPortalApi.getStakeholderActivity(stakeholderOrgId, activityId),
		enabled: !!stakeholderOrgId && !!activityId,
	});
}

export function useCreateStakeholderActivity(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateActivityInput) =>
			StakeholderPortalApi.createStakeholderActivity(stakeholderOrgId, input),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "activities"],
			});
			toast.success("Activity created successfully");
		},
		onError: (err: any) => toast.error(err.message || "Failed to create activity"),
	});
}

export function useSubmitStakeholderActivity(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (activityId: string) =>
			StakeholderPortalApi.submitStakeholderActivity(stakeholderOrgId, activityId),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "activities"],
			});
			toast.success("Activity submitted for review");
		},
		onError: (err: any) => toast.error(err.message || "Failed to submit activity"),
	});
}

export function useReviewStakeholderActivity(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			activityId,
			status,
			reviewComments,
		}: {
			activityId: string;
			status: "approved" | "rejected";
			reviewComments?: string;
		}) =>
			StakeholderPortalApi.reviewStakeholderActivity(
				stakeholderOrgId,
				activityId,
				status,
				reviewComments,
			),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "activities"],
			});
			toast.success("Activity reviewed successfully");
		},
		onError: (err: any) => toast.error(err.message || "Failed to review activity"),
	});
}

// ============================================
// STAKEHOLDER PERMITS
// ============================================

export function useStakeholderPermits(
	stakeholderOrgId: string,
	params: {
		status?: string;
		page?: number;
		limit?: number;
	} = {},
) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "permits", params],
		queryFn: () => StakeholderPortalApi.listStakeholderPermits(stakeholderOrgId, params),
		enabled: !!stakeholderOrgId,
	});
}

export function useCreateStakeholderPermit(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreatePermitInput) =>
			StakeholderPortalApi.createStakeholderPermit(stakeholderOrgId, input),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "permits"],
			});
			toast.success("Permit application submitted");
		},
		onError: (err: any) => toast.error(err.message || "Failed to apply for permit"),
	});
}

export function useApproveStakeholderPermit(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (permitId: string) =>
			StakeholderPortalApi.approveStakeholderPermit(stakeholderOrgId, permitId),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "permits"],
			});
			toast.success("Permit approved");
		},
		onError: (err: any) => toast.error(err.message || "Failed to approve permit"),
	});
}

export function useRejectStakeholderPermit(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ permitId, reason }: { permitId: string; reason: string }) =>
			StakeholderPortalApi.rejectStakeholderPermit(stakeholderOrgId, permitId, reason),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "permits"],
			});
			toast.success("Permit rejected");
		},
		onError: (err: any) => toast.error(err.message || "Failed to reject permit"),
	});
}

// ============================================
// GLOBAL PERMITS (Admin Queue)
// ============================================

import type { GlobalPermitListParams } from "@/types/stakeholder-portal";
import { useAuthStore } from "@/stores/auth";

export function useGlobalPermits(params: GlobalPermitListParams = {}) {
	return useQuery({
		queryKey: ["global-permits", params],
		queryFn: () => StakeholderPortalApi.listGlobalPermits(params),
	});
}

export function useApproveGlobalPermit() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (permitId: string) =>
			StakeholderPortalApi.approveGlobalPermit(permitId),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["global-permits"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			toast.success("Permit approved successfully");
		},
		onError: (err: any) => toast.error(err.message || "Failed to approve permit"),
	});
}

export function useRejectGlobalPermit() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ permitId, reason }: { permitId: string; reason: string }) =>
			StakeholderPortalApi.rejectGlobalPermit(permitId, reason),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ["global-permits"] });
			qc.invalidateQueries({ queryKey: ["stakeholder-orgs"] });
			toast.success("Permit rejected");
		},
		onError: (err: any) => toast.error(err.message || "Failed to reject permit"),
	});
}

// ============================================
// STAKEHOLDER FLIGHTS
// ============================================

export function useStakeholderFlights(
	stakeholderOrgId: string,
	params: {
		date?: string;
		flightStatus?: string;
		page?: number;
		limit?: number;
	} = {},
) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "flights", params],
		queryFn: () => StakeholderPortalApi.listStakeholderFlights(stakeholderOrgId, params),
		enabled: !!stakeholderOrgId,
	});
}

export function useCreateStakeholderFlight(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateFlightInput) =>
			StakeholderPortalApi.createStakeholderFlight(stakeholderOrgId, input),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "flights"],
			});
			toast.success("Flight schedule submitted");
		},
		onError: (err: any) => toast.error(err.message || "Failed to submit flight"),
	});
}

export function useUpdateStakeholderFlight(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			flightId,
			input,
		}: {
			flightId: string;
			input: Partial<CreateFlightInput & { flightStatus: string; gate: string }>;
		}) => StakeholderPortalApi.updateStakeholderFlight(stakeholderOrgId, flightId, input),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "flights"],
			});
			toast.success("Flight updated");
		},
		onError: (err: any) => toast.error(err.message || "Failed to update flight"),
	});
}

// ============================================
// STAKEHOLDER INVOICES
// ============================================

export function useStakeholderInvoices(
	stakeholderOrgId: string,
	params: {
		paymentStatus?: string;
		reviewStatus?: string;
		page?: number;
		limit?: number;
	} = {},
) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "invoices", params],
		queryFn: () => StakeholderPortalApi.listStakeholderInvoices(stakeholderOrgId, params),
		enabled: !!stakeholderOrgId,
	});
}

export function useCreateStakeholderInvoice(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateInvoiceInput) =>
			StakeholderPortalApi.createStakeholderInvoice(stakeholderOrgId, input),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "invoices"],
			});
			toast.success("Invoice submitted");
		},
		onError: (err: any) => toast.error(err.message || "Failed to submit invoice"),
	});
}

export function useReviewStakeholderInvoice(stakeholderOrgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			invoiceId,
			reviewStatus,
			reviewComments,
		}: {
			invoiceId: string;
			reviewStatus: "approved" | "rejected";
			reviewComments?: string;
		}) =>
			StakeholderPortalApi.reviewStakeholderInvoice(
				stakeholderOrgId,
				invoiceId,
				reviewStatus,
				reviewComments,
			),
		onSuccess: () => {
			qc.invalidateQueries({
				queryKey: ["stakeholder-orgs", stakeholderOrgId, "invoices"],
			});
			toast.success("Invoice reviewed");
		},
		onError: (err: any) => toast.error(err.message || "Failed to review invoice"),
	});
}

// ============================================
// STAKEHOLDER AUTH
// ============================================

export function useStakeholderLogin() {
	return useMutation({
		mutationFn: (input: StakeholderAuthLoginInput) =>
			StakeholderPortalApi.stakeholderLogin(input),
		onSuccess: (data) => {
			console.log("data", data);
			// Save to specific storage keys for persistence specific to stakeholder handling if needed
			localStorage.setItem("stakeholder_token", data.accessToken);
			localStorage.setItem("stakeholder_user", JSON.stringify(data.user));
			if (data.organization) {
				localStorage.setItem("stakeholder_org", JSON.stringify(data.organization));
			}

			// Sync with main AuthStore so the UI (Dashboard) knows we are logged in
			useAuthStore.getState().login({
				accessToken: data.accessToken,
				refreshToken: data.refreshToken,
				user: {
					id: data.user.id,
					name: `${data.user.firstName} ${data.user.lastName}`,
					email: data.user.email,
					role: data.user.role,
					organizationId: data.organization?.id || data.user.stakeholderOrganizationId,
					type: (data.user as any).type || "stakeholder",
				},
			});

			toast.success("Login successful");
		},
		onError: (err: any) => toast.error(err.message || "Login failed"),
	});
}

export function useStakeholderRegister() {
	return useMutation({
		mutationFn: (input: StakeholderRegistrationInput) =>
			StakeholderPortalApi.stakeholderRegister(input),
		onSuccess: () => {
			toast.success(
				"Registration submitted! You will receive an email once your account is verified.",
			);
		},
		onError: (err: any) => toast.error(err.message || "Registration failed"),
	});
}

export function useStakeholderForgotPassword() {
	return useMutation({
		mutationFn: (email: string) =>
			StakeholderPortalApi.stakeholderForgotPassword(email),
		onSuccess: () => {
			toast.success("Password reset email sent");
		},
		onError: (err: any) => toast.error(err.message || "Failed to send reset email"),
	});
}

// ============================================
// STAKEHOLDER DASHBOARD
// ============================================

export function useStakeholderDashboard(stakeholderOrgId: string) {
	return useQuery({
		queryKey: ["stakeholder-orgs", stakeholderOrgId, "dashboard"],
		queryFn: () => StakeholderPortalApi.getStakeholderDashboard(stakeholderOrgId),
		enabled: !!stakeholderOrgId,
	});
}
