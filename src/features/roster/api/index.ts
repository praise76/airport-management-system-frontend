import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import type {
	Roster,
	RosterEntry,
	ShiftPattern,
	ShiftSwapRequest,
} from "../types";

// Every backend response is wrapped as { success, data }. Most of the hooks in this
// file were reading the axios response's own `data` field and returning it as-is,
// without unwrapping the envelope's *inner* `data` - so callers received
// `{ success: true, data: [...] }` where they expected the payload itself
// (`[...]`), and a bare `.map()`/`.entries` access on that either silently rendered
// nothing or (in one place) got worked around with an `Array.isArray(...) ? ... :
// (x as any)?.data` check at the call site instead of being fixed here. Every hook
// below now consistently unwraps `data.data`.

// --- Roster Management (Admin) ---

export const useGetRosters = (filters?: {
	unitDepartmentId?: string;
	departmentId?: string;
	status?: string;
}) => {
	return useQuery({
		queryKey: ["rosters", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (filters?.unitDepartmentId)
				params.append("unitDepartmentId", filters.unitDepartmentId);
			if (filters?.departmentId)
				params.append("departmentId", filters.departmentId);
			if (filters?.status) params.append("status", filters.status);

			const { data } = await api.get<{ data: Roster[] }>(
				`/roster?${params.toString()}`,
			);
			return data.data;
		},
	});
};

export const useGetRoster = (id: string) => {
	return useQuery({
		queryKey: ["roster", id],
		queryFn: async () => {
			const { data } = await api.get<{
				data: Roster & { entries: RosterEntry[] };
			}>(`/roster/${id}`);
			return data.data;
		},
		enabled: !!id,
	});
};

export const useCreateRoster = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (roster: Partial<Roster>) => {
			const { data } = await api.post<{ data: Roster }>("/roster", roster);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rosters"] });
		},
	});
};

export const useUpdateRoster = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<Roster>;
		}) => {
			const { data } = await api.patch<{ data: Roster }>(
				`/roster/${id}`,
				updates,
			);
			return data.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["roster", data.id] });
			queryClient.invalidateQueries({ queryKey: ["rosters"] });
		},
	});
};

export const useApproveRoster = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			const { data } = await api.post<{ data: Roster }>(
				`/roster/${id}/approve`,
			);
			return data.data;
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["roster", data.id] });
			queryClient.invalidateQueries({ queryKey: ["rosters"] });
		},
	});
};

export const useDeleteRoster = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/roster/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rosters"] });
		},
	});
};

// --- Roster Entries ---

export const useAddRosterEntry = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			rosterId,
			entry,
		}: {
			rosterId: string;
			entry: Partial<RosterEntry>;
		}) => {
			const { data } = await api.post<{ data: RosterEntry }>(
				`/roster/${rosterId}/entries`,
				entry,
			);
			return data.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["roster", variables.rosterId],
			});
		},
	});
};

export const useUpdateRosterEntry = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			rosterId,
			entryId,
			updates,
		}: {
			rosterId: string;
			entryId: string;
			updates: Partial<RosterEntry>;
		}) => {
			const { data } = await api.patch<{ data: RosterEntry }>(
				`/roster/${rosterId}/entries/${entryId}`,
				updates,
			);
			return data.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["roster", variables.rosterId],
			});
			queryClient.invalidateQueries({ queryKey: ["my-roster"] });
		},
	});
};

export const useDeleteRosterEntry = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			rosterId,
			entryId,
		}: {
			rosterId: string;
			entryId: string;
		}) => {
			await api.delete(`/roster/${rosterId}/entries/${entryId}`);
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: ["roster", variables.rosterId],
			});
		},
	});
};

// --- Employee Access ---

// The backend returns a flat array of upcoming entries for /roster/my (see
// src/modules/roster/routes.ts on the backend) - not a single roster object with an
// `entries` field, which is what this hook (and its callers' `.entries` access)
// assumed until now.
export const useMyRoster = () => {
	return useQuery({
		queryKey: ["my-roster"],
		queryFn: async () => {
			const { data } = await api.get<{ data: RosterEntry[] }>("/roster/my");
			return data.data;
		},
	});
};

// The backend scopes this to the calling user (src/modules/roster/routes.ts calls
// getTodayRoster(userId)) and returns a single entry or null - not a team-wide list,
// despite the "Today's Team" label this used to be rendered under.
export const useTodaysRoster = () => {
	return useQuery({
		queryKey: ["todays-roster"],
		queryFn: async () => {
			const { data } = await api.get<{
				data: (RosterEntry & { staffId?: string }) | null;
			}>("/roster/today");
			return data.data;
		},
	});
};

// --- Switch Swaps ---

export const useGetPendingSwaps = () => {
	return useQuery({
		queryKey: ["pending-swaps"],
		queryFn: async () => {
			const { data } = await api.get<{ data: ShiftSwapRequest[] }>(
				"/roster/swaps/pending",
			);
			return data.data;
		},
	});
};

export const useRequestSwap = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (request: {
			targetUserId: string;
			reason: string;
			entryToGiveId: string;
			entryToReceiveId?: string;
		}) => {
			const { data } = await api.post<{ data: ShiftSwapRequest }>(
				"/roster/swap",
				request,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["my-roster"] });
			// Also maybe pending swaps if we list outgoing ones
		},
	});
};

export const useRespondToSwap = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			swapId,
			action,
		}: {
			swapId: string;
			action: "accept" | "reject";
		}) => {
			const { data } = await api.post<{ data: unknown }>(
				`/roster/swap/${swapId}/respond`,
				{ action },
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["pending-swaps"] });
			queryClient.invalidateQueries({ queryKey: ["my-roster"] });
		},
	});
};

export const useReviewSwap = () => {
	// Supervisor
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			swapId,
			action,
		}: {
			swapId: string;
			action: "approve" | "reject";
		}) => {
			const { data } = await api.post<{ data: unknown }>(
				`/roster/swap/${swapId}/review`,
				{ action },
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["roster"] }); // Invalidate general roster as it changes schedule
		},
	});
};

// --- Shift Definitions ---
import type { ShiftDefinition } from "../types";

export const useGetShiftDefinitions = (filters?: {
	unitDepartmentId?: string;
}) => {
	return useQuery({
		queryKey: ["shift-definitions", filters],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (filters?.unitDepartmentId)
				params.append("unitDepartmentId", filters.unitDepartmentId);

			const { data } = await api.get<{ data: ShiftDefinition[] }>(
				`/roster/shifts?${params.toString()}`,
			);
			return data.data;
		},
	});
};

export const useCreateShiftDefinition = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (shift: Partial<ShiftDefinition>) => {
			const { data } = await api.post<{ data: ShiftDefinition }>(
				"/roster/shifts",
				shift,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shift-definitions"] });
		},
	});
};

export const useUpdateShiftDefinition = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			updates,
		}: {
			id: string;
			updates: Partial<ShiftDefinition>;
		}) => {
			const { data } = await api.patch<{ data: ShiftDefinition }>(
				`/roster/shifts/${id}`,
				updates,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shift-definitions"] });
		},
	});
};

export const useDeleteShiftDefinition = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (id: string) => {
			await api.delete(`/roster/shifts/${id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shift-definitions"] });
		},
	});
};

// --- Shift Patterns ---

export const useGetShiftPatterns = () => {
	return useQuery({
		queryKey: ["shift-patterns"],
		queryFn: async () => {
			const { data } = await api.get<{ data: ShiftPattern[] }>(
				"/roster/patterns",
			);
			return data.data;
		},
	});
};

export const useCreateShiftPattern = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (pattern: Omit<ShiftPattern, "id">) => {
			const { data } = await api.post<{ data: ShiftPattern }>(
				"/roster/patterns",
				pattern,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["shift-patterns"] });
		},
	});
};

export const useAssignShiftPattern = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (assignment: {
			userId: string;
			shiftPatternId: string;
			effectiveFrom: string;
		}) => {
			const { data } = await api.post<{ data: unknown }>(
				"/roster/patterns/assign",
				assignment,
			);
			return data.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["rosters"] }); // Invalidate rosters as assignments change schedule
		},
	});
};
