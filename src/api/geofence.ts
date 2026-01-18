import { api } from "./client";
import type { GeofenceZone, GeofenceZoneInput, GeofenceZoneUpdate } from "@/types/geofence";

export async function getGeofenceZones(): Promise<GeofenceZone[]> {
  const res = await api.get("/geofence/zones");
  return res.data.data;
}

export async function getGeofenceZone(id: string): Promise<GeofenceZone> {
  const res = await api.get(`/geofence/zones/${id}`);
  return res.data.data;
}

export async function createGeofenceZone(input: GeofenceZoneInput): Promise<GeofenceZone> {
  const res = await api.post("/geofence/zones", input);
  return res.data.data;
}

export async function updateGeofenceZone(id: string, input: GeofenceZoneUpdate): Promise<GeofenceZone> {
  const res = await api.patch(`/geofence/zones/${id}`, input);
  return res.data.data;
}

export async function deleteGeofenceZone(id: string): Promise<void> {
  await api.delete(`/geofence/zones/${id}`);
}
