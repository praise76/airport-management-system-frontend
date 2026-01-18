import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as PositionsApi from "@/api/positions";
import type { PositionInput, PositionUpdate, PositionAssignInput } from "@/types/position";
import { toast } from "sonner";

export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: () => PositionsApi.getPositions(),
  });
}

export function usePosition(id: string) {
  return useQuery({
    queryKey: ["positions", id],
    queryFn: () => PositionsApi.getPosition(id),
    enabled: !!id,
  });
}

export function usePositionHierarchy() {
  return useQuery({
    queryKey: ["positions", "hierarchy"],
    queryFn: () => PositionsApi.getPositionHierarchy(),
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PositionInput) => PositionsApi.createPosition(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create position"),
  });
}

export function useUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PositionUpdate }) => PositionsApi.updatePosition(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update position"),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PositionsApi.deletePosition(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Position deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete position"),
  });
}

export function useAssignPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ positionId, input }: { positionId: string; input: PositionAssignInput }) =>
      PositionsApi.assignPosition(positionId, input),
    onSuccess: (_, { positionId }) => {
      qc.invalidateQueries({ queryKey: ["positions", positionId, "assignments"] });
      toast.success("Position assigned");
    },
    onError: (err: any) => toast.error(err.message || "Failed to assign position"),
  });
}

export function usePositionAssignments(positionId: string) {
  return useQuery({
    queryKey: ["positions", positionId, "assignments"],
    queryFn: () => PositionsApi.getPositionAssignments(positionId),
    enabled: !!positionId,
  });
}
