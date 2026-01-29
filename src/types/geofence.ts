// Geofence Types based on OpenAPI spec

export interface GeofenceZone {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  zoneType: "work" | "parking" | "restricted";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceZoneInput {
  organizationId: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  zoneType: "work" | "parking" | "restricted";
}

export interface GeofenceZoneUpdate {
  name?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  zoneType?: "work" | "parking" | "restricted";
  isActive?: boolean;
}
