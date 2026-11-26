import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkInStation, checkOutStation, getStationOnDuty, getStationStaffing } from "@/api/stations";
import { listDepartments } from "@/api/departments";
import type { CheckInRequest } from "@/types/stations";

export function useListStations() {
  return useQuery({
    queryKey: ["stations", "list"],
    queryFn: () => listDepartments({ departmentLevel: 3 }),
  });
}

export function useStationStaffing(stationId: string) {
  return useQuery({
    queryKey: ["stations", stationId, "staffing"],
    queryFn: () => getStationStaffing(stationId),
    enabled: !!stationId,
  });
}

/** Who an emergency ping at this post reaches: everyone on duty there, refreshed while the card is open. */
export function useStationOnDuty(stationId: string) {
  return useQuery({
    queryKey: ["stations", stationId, "on-duty"],
    queryFn: () => getStationOnDuty(stationId),
    enabled: !!stationId,
    refetchInterval: 30_000,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, coords }: { stationId: string; coords: CheckInRequest }) =>
      checkInStation(stationId, coords),
    onSuccess: (_, { stationId }) => {
      queryClient.invalidateQueries({ queryKey: ["stations", stationId] });
      queryClient.invalidateQueries({ queryKey: ["station-history"] });
      toast.success("Checked in successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to check in");
    },
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (stationId: string) => checkOutStation(stationId),
    onSuccess: (_, stationId) => {
      queryClient.invalidateQueries({ queryKey: ["stations", stationId] });
      queryClient.invalidateQueries({ queryKey: ["station-history"] });
      toast.success("Checked out successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to check out");
    },
  });
}
