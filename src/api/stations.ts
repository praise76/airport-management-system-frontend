import { api } from "./client";
import type { StationStaffing, CheckInRequest } from "@/types/stations";

export async function checkInStation(stationId: string, coords: CheckInRequest): Promise<void> {
  await api.post(`/stations/${stationId}/check-in`, coords);
}

export async function checkOutStation(stationId: string): Promise<void> {
  await api.post(`/stations/${stationId}/check-out`);
}

export async function getStationStaffing(stationId: string): Promise<StationStaffing[]> {
  const res = await api.get(`/stations/${stationId}/staffing`);
  return (res.data?.data ?? res.data) as StationStaffing[];
}
