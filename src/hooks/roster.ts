import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as RosterApi from "@/api/roster";
import { toast } from "sonner";

export function useRosters(params?: { unitId?: string; status?: string }) {
  return useQuery({
    queryKey: ["roster", params],
    queryFn: () => RosterApi.listRosters(params),
  });
}

export function useMyRoster() {
  return useQuery({
    queryKey: ["roster", "my"],
    queryFn: () => RosterApi.getMyRoster(),
  });
}

export function useTodaysRoster() {
  return useQuery({
    queryKey: ["roster", "today"],
    queryFn: () => RosterApi.getTodaysRoster(),
  });
}

export function useCreateRoster() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof RosterApi.createRoster>[0]) => RosterApi.createRoster(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] });
      toast.success("Roster created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create roster");
    },
  });
}

export function useAddRosterEntry(rosterId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof RosterApi.addRosterEntry>[1]) => RosterApi.addRosterEntry(rosterId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roster"] }); // Invalidate all rosters maybe?
      qc.invalidateQueries({ queryKey: ["roster", rosterId] }); // If we had getRoster logic
      toast.success("Entry added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add roster entry");
    },
  });
}

export function useRequestSwap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof RosterApi.requestSwap>[0]) => RosterApi.requestSwap(input),
    onSuccess: () => {
      toast.success("Swap request sent");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to request swap");
    },
  });
}

export function useRespondToSwap(swapId: string) {
  return useMutation({
    mutationFn: (input: Parameters<typeof RosterApi.respondToSwap>[1]) => RosterApi.respondToSwap(swapId, input),
    onSuccess: () => {
      toast.success("Response sent");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to respond to swap");
    },
  });
}
