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
  
  // Check-in/out details
  checkInTime?: string
  checkOutTime?: string
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

export interface CheckLocationResponse {
  inside: boolean
  zone?: {
    id: string
    name: string
  }
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
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

