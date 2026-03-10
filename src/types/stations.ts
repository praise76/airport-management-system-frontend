export interface StationSession {
  id: string;
  stationId: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string;
  latitude: number;
  longitude: number;
}

export interface StationStaffing {
  userId: string;
  firstName: string;
  lastName: string;
  checkInTime: string;
  position?: string;
}

export interface CheckInRequest {
  latitude: number;
  longitude: number;
}
