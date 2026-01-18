import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as TerminalsApi from "@/api/terminals";
import type { TerminalInput, TerminalUpdate } from "@/types/terminal";
import { toast } from "sonner";

export function useTerminals() {
  return useQuery({
    queryKey: ["terminals"],
    queryFn: () => TerminalsApi.getTerminals(),
  });
}

export function useTerminal(id: string) {
  return useQuery({
    queryKey: ["terminals", id],
    queryFn: () => TerminalsApi.getTerminal(id),
    enabled: !!id,
  });
}

export function useTerminalStats(id: string) {
  return useQuery({
    queryKey: ["terminals", id, "stats"],
    queryFn: () => TerminalsApi.getTerminalStats(id),
    enabled: !!id,
  });
}

export function useCreateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TerminalInput) => TerminalsApi.createTerminal(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["terminals"] });
      toast.success("Terminal created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create terminal"),
  });
}

export function useUpdateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TerminalUpdate }) => TerminalsApi.updateTerminal(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["terminals"] });
      toast.success("Terminal updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update terminal"),
  });
}

export function useDeleteTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TerminalsApi.deleteTerminal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["terminals"] });
      toast.success("Terminal deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete terminal"),
  });
}
