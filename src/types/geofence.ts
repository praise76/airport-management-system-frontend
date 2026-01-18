// Geofence Types based on OpenAPI spec

export interface GeofenceZone {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  zoneType: "office" | "terminal" | "restricted" | "parking";
  coordinates: Array<{ lat: number; lng: number }>;
  radius?: number;
  isActive: boolean;
  createdAt: string;
}

export interface GeofenceZoneInput {
  organizationId: string;
  name: string;
  description?: string;
  zoneType: "office" | "terminal" | "restricted" | "parking";
  coordinates: Array<{ lat: number; lng: number }>;
  radius?: number;
}

export interface GeofenceZoneUpdate {
  name?: string;
  description?: string;
  zoneType?: "office" | "terminal" | "restricted" | "parking";
  coordinates?: Array<{ lat: number; lng: number }>;
  radius?: number;
  isActive?: boolean;
}
