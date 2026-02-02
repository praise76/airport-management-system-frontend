import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTerminals, getTerminal, getTerminalStats, createTerminal, updateTerminal, deleteTerminal, getTerminalRepresentatives, addTerminalRepresentative, removeTerminalRepresentative, submitTerminalReport, getTerminalPerformance } from "@/api/terminals";
import type { TerminalUpdate, TerminalRepresentativeInput, TerminalReportInput } from "@/types/terminal";
import { toast } from "sonner";

export const terminalKeys = {
  all: ["terminals"] as const,
  lists: () => [...terminalKeys.all, "list"] as const,
  list: () => [...terminalKeys.lists()] as const,
  details: () => [...terminalKeys.all, "detail"] as const,
  detail: (id: string) => [...terminalKeys.details(), id] as const,
  stats: (id: string) => [...terminalKeys.detail(id), "stats"] as const,
  representatives: (id: string) => [...terminalKeys.detail(id), "representatives"] as const,
  performance: (id: string) => [...terminalKeys.detail(id), "performance"] as const,
};

export function useTerminals() {
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
      toast.success("Representative added");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add representative");
    }
  });
}

export function useRemoveTerminalRepresentative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeTerminalRepresentative,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.details() });
      toast.success("Representative removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove representative");
    }
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
      toast.success("Terminal created");
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
      toast.success("Terminal updated");
    },
  });
}

export function useDeleteTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
      toast.success("Terminal deleted");
    },
  });
}

export function useSubmitTerminalReport() {
  return useMutation({
    mutationFn: ({ terminalId, input }: { terminalId: string; input: TerminalReportInput }) =>
      submitTerminalReport(terminalId, input),
    onSuccess: () => {
      toast.success("Report submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to submit report");
    }
  });
}

export function useTerminalPerformance(id: string) {
  return useQuery({
    queryKey: terminalKeys.performance(id),
    queryFn: () => getTerminalPerformance(id),
    enabled: !!id,
  });
}

