import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { checkInStation, checkOutStation, getStationStaffing } from "@/api/stations";
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

export function useCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ stationId, coords }: { stationId: string; coords: CheckInRequest }) =>
      checkInStation(stationId, coords),
    onSuccess: (_, { stationId }) => {
      queryClient.invalidateQueries({ queryKey: ["stations", stationId, "staffing"] });
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
      queryClient.invalidateQueries({ queryKey: ["stations", stationId, "staffing"] });
      toast.success("Checked out successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to check out");
    },
  });
}
