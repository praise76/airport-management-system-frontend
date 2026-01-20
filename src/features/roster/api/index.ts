
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api/client";
import { Roster, RosterEntry, ShiftSwapRequest } from "../types";

// --- Roster Management (Admin) ---

export const useGetRosters = (filters?: { unitId?: string; departmentId?: string; status?: string }) => {
  return useQuery({
    queryKey: ["rosters", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.unitId) params.append("unitId", filters.unitId);
      if (filters?.departmentId) params.append("departmentId", filters.departmentId);
      if (filters?.status) params.append("status", filters.status);
      
      const { data } = await api.get<Roster[]>(`/roster?${params.toString()}`);
      return data;
    },
  });
};

export const useGetRoster = (id: string) => {
  return useQuery({
    queryKey: ["roster", id],
    queryFn: async () => {
      const { data } = await api.get<Roster & { entries: RosterEntry[] }>(`/roster/${id}`);
      return data;
    },
    enabled: !!id,
  });
};

export const useCreateRoster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (roster: Partial<Roster>) => {
      const { data } = await api.post<Roster>("/roster", roster);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rosters"] });
    },
  });
};

export const useUpdateRoster = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Roster> }) => {
      const { data } = await api.patch<Roster>(`/roster/${id}`, updates);
      return data;
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
      const { data } = await api.post<Roster>(`/roster/${id}/approve`);
      return data;
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
    mutationFn: async ({ rosterId, entry }: { rosterId: string; entry: Partial<RosterEntry> }) => {
      const { data } = await api.post<RosterEntry>(`/roster/${rosterId}/entries`, entry);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roster", variables.rosterId] });
    },
  });
};

export const useUpdateRosterEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rosterId, entryId, updates }: { rosterId: string; entryId: string; updates: Partial<RosterEntry> }) => {
      const { data } = await api.patch<RosterEntry>(`/roster/${rosterId}/entries/${entryId}`, updates);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roster", variables.rosterId] });
      queryClient.invalidateQueries({ queryKey: ["my-roster"] }); 
    },
  });
};

export const useDeleteRosterEntry = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rosterId, entryId }: { rosterId: string; entryId: string }) => {
      await api.delete(`/roster/${rosterId}/entries/${entryId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roster", variables.rosterId] });
    },
  });
};

// --- Employee Access ---

export const useMyRoster = () => {
  return useQuery({
    queryKey: ["my-roster"],
    queryFn: async () => {
      const { data } = await api.get<{ entries: RosterEntry[] }>("/roster/my");
      return data;
    },
  });
};

export const useTodaysRoster = () => {
  return useQuery({
    queryKey: ["todays-roster"],
    queryFn: async () => {
      const { data } = await api.get<Array<RosterEntry & { staffId?: string }>>("/roster/today");
      return data;
    },
  });
};

// --- Switch Swaps ---

export const useGetPendingSwaps = () => {
  return useQuery({
    queryKey: ["pending-swaps"],
    queryFn: async () => {
      const { data } = await api.get<ShiftSwapRequest[]>("/roster/swaps/pending");
      return data;
    },
  });
};

export const useRequestSwap = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: { targetUserId: string; reason: string; entryToGiveId: string; entryToReceiveId?: string }) => {
      const { data } = await api.post<ShiftSwapRequest>("/roster/swap", request);
      return data;
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
    mutationFn: async ({ swapId, action }: { swapId: string; action: 'accept' | 'reject' }) => {
      const { data } = await api.post(`/roster/swap/${swapId}/respond`, { action });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-swaps"] });
      queryClient.invalidateQueries({ queryKey: ["my-roster"] });
    },
  });
};

export const useReviewSwap = () => { // Supervisor
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ swapId, action }: { swapId: string; action: 'approve' | 'reject' }) => {
      const { data } = await api.post(`/roster/swap/${swapId}/review`, { action });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roster"] }); // Invalidate general roster as it changes schedule
    },
  });
};
