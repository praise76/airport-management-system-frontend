import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as GeofenceApi from "@/api/geofence";
import type { GeofenceZoneInput, GeofenceZoneUpdate } from "@/types/geofence";
import { toast } from "sonner";

export function useGeofenceZones() {
  return useQuery({
    queryKey: ["geofence", "zones"],
    queryFn: () => GeofenceApi.getGeofenceZones(),
  });
}

export function useGeofenceZone(id: string) {
  return useQuery({
    queryKey: ["geofence", "zones", id],
    queryFn: () => GeofenceApi.getGeofenceZone(id),
    enabled: !!id,
  });
}

export function useCreateGeofenceZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GeofenceZoneInput) => GeofenceApi.createGeofenceZone(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofence", "zones"] });
      toast.success("Geofence zone created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create zone"),
  });
}

export function useUpdateGeofenceZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: GeofenceZoneUpdate }) => GeofenceApi.updateGeofenceZone(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofence", "zones"] });
      toast.success("Geofence zone updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update zone"),
  });
}

export function useDeleteGeofenceZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => GeofenceApi.deleteGeofenceZone(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofence", "zones"] });
      toast.success("Geofence zone deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete zone"),
  });
}
