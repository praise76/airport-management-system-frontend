import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTerminals, getTerminal, getTerminalStats, createTerminal, updateTerminal, deleteTerminal } from "@/api/terminals";
import type { TerminalUpdate } from "@/types/terminal";

export const terminalKeys = {
  all: ["terminals"] as const,
  lists: () => [...terminalKeys.all, "list"] as const,
  list: () => [...terminalKeys.lists()] as const,
  details: () => [...terminalKeys.all, "detail"] as const,
  detail: (id: string) => [...terminalKeys.details(), id] as const,
  stats: (id: string) => [...terminalKeys.detail(id), "stats"] as const,
};

export function useTerminals() {
  return useQuery({
    queryKey: terminalKeys.list(),
    queryFn: getTerminals,
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
