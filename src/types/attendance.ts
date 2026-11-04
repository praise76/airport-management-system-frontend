export type AttendanceStatus = 
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'clocked_in'
  | 'clocked_out'
  | 'ABSENT'
  | 'ON_LEAVE'

export interface GeofenceZone {
  id: string
  name: string
  description?: string
  type: 'polygon' | 'circle'
  /** Category, e.g. 'terminal', 'office', 'restricted'. May be missing on older zones. */
  zoneType?: string
  latitude?: number // Required for circle
  longitude?: number // Required for circle
  radius?: number // in meters. Required for circle.
  polygonJson?: any // Required for polygon
  organizationId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  userId: string
  user: {
    userId: string
    firstName: string
    lastName: string
    email: string
    departmentId?: string
  }
  status: AttendanceStatus
  
  // Check-in/out details (api.json names them clockIn / clockOut)
  checkInTime?: string
  checkOutTime?: string
  clockIn?: string
  clockOut?: string | null
  checkInLocation?: {
    lat: number
    lng: number
  }
  checkOutLocation?: {
    lat: number
    lng: number
  }
  checkInZone?: {
    id: string
    name: string
  }
  checkOutZone?: {
    id: string
    name: string
  }
  
  // Metadata
  date: string // YYYY-MM-DD
  organizationId: string
  notes?: string
  
  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface ActiveSession {
  id: string
  startedAt: string
  zoneName?: string
}

export interface RosterInfo {
  scheduled: boolean
  isLate: boolean
  lateMinutes: number
  scheduledStart: string
  rosterEntryId: string
}

export interface CheckInResponse {
  status: 'clocked_in'
  sessionId: string
  rosterInfo: RosterInfo
}

export interface CheckOutResponse {
  status: 'clocked_out'
  sessionId: string
}

/** What the server says about a position, without changing anything (see getLocationStatus). */
export interface CheckLocationResponse {
  inside: boolean
  zone: {
    id: string
    name: string
  } | null
  /** The person already has an open session. */
  checkedIn: boolean
}

export interface AttendanceLog {
  id: string
  eventType: 'auto_in' | 'manual_in' | 'auto_out' | 'manual_out'
  createdAt: string
  zoneName?: string
}

export interface DailyAttendance {
  date: string
  activeSession: ActiveSession | null
  logs: AttendanceLog[]
  status?: AttendanceStatus
  checkInTime?: string
  checkOutTime?: string
  checkInZone?: {
    id: string
    name: string
  }
  checkOutZone?: {
    id: string
    name: string
  }
  rosterInfo?: RosterInfo
}

export interface AttendanceSummary {
  activeUsers: number
  checkedInToday: number
  // Read by the dashboard tile; GET /attendance/summary isn't in api.json, so these are
  // optional until the backend's format is confirmed.
  checkedIn?: number
  totalEmployees?: number
  absent?: number
  onLeave?: number
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

