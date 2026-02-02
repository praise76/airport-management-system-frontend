// Geofence Types based on OpenAPI spec

export interface GeofenceZone {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: "polygon" | "circle";
  latitude?: number;    // Center for circle
  longitude?: number;   // Center for circle
  radius?: number;      // Meters for circle
  polygonJson?: any;    // Coordinates for polygon
  zoneType: "office" | "terminal" | "restricted" | "parking" | "work";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeofenceZoneInput {
  organizationId: string;
  name: string;
  description?: string;
  type: "polygon" | "circle";
  latitude?: number;
  longitude?: number;
  radius?: number;
  polygonJson?: any;
  zoneType: "office" | "terminal" | "restricted" | "parking" | "work";
}

export interface GeofenceZoneUpdate {
  name?: string;
  description?: string;
  type?: "polygon" | "circle";
  latitude?: number;
  longitude?: number;
  radius?: number;
  polygonJson?: any;
  zoneType?: "office" | "terminal" | "restricted" | "parking" | "work";
  isActive?: boolean;
}
