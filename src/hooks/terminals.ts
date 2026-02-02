import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTerminals, getTerminal, getTerminalStats, createTerminal, updateTerminal, deleteTerminal, getTerminalRepresentatives, addTerminalRepresentative, removeTerminalRepresentative } from "@/api/terminals";
import type { TerminalUpdate, TerminalRepresentativeInput } from "@/types/terminal";

export const terminalKeys = {
  all: ["terminals"] as const,
  lists: () => [...terminalKeys.all, "list"] as const,
  list: () => [...terminalKeys.lists()] as const,
  details: () => [...terminalKeys.all, "detail"] as const,
  detail: (id: string) => [...terminalKeys.details(), id] as const,
  stats: (id: string) => [...terminalKeys.detail(id), "stats"] as const,
  representatives: (id: string) => [...terminalKeys.detail(id), "representatives"] as const,
};

export function useTerminals() {
// ... existing useTerminals
  return useQuery({
    queryKey: terminalKeys.list(),
    queryFn: getTerminals,
  });
}

// ... existing hooks

export function useTerminalRepresentatives(terminalId: string) {
  return useQuery({
    queryKey: terminalKeys.representatives(terminalId),
    queryFn: () => getTerminalRepresentatives(terminalId),
    enabled: !!terminalId,
  });
}

export function useAddTerminalRepresentative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ terminalId, input }: { terminalId: string; input: TerminalRepresentativeInput }) =>
      addTerminalRepresentative(terminalId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.representatives(data.terminalId) });
    },
  });
}

export function useRemoveTerminalRepresentative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeTerminalRepresentative,
    onSuccess: () => {
      // Ideally we'd know which terminal to invalidate, but void return makes it hard.
      // We can invalidate all details or just rely on parent component refetching if critical.
      // For now, invalidating all 'details' is a safe broad approach or assume caller handles it.
      // Better: pass terminalId in mutation context if needed.
      queryClient.invalidateQueries({ queryKey: terminalKeys.details() }); 
    },
  });
}


export function useTerminal(id: string) {
  return useQuery({
    queryKey: terminalKeys.detail(id),
    queryFn: () => getTerminal(id),
    enabled: !!id,
  });
}

export function useTerminalStats(id: string) {
  return useQuery({
    queryKey: terminalKeys.stats(id),
    queryFn: () => getTerminalStats(id),
    enabled: !!id,
  });
}

export function useCreateTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
    },
  });
}

export function useUpdateTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TerminalUpdate }) =>
      updateTerminal(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
    },
  });
}

export function useDeleteTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
    },
  });
}
