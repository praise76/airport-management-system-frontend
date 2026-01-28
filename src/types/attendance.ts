export type AttendanceStatus = 
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'ABSENT'
  | 'ON_LEAVE'

export interface GeofenceZone {
  id: string
  name: string
  description?: string
  coordinates: {
    latitude: number
    longitude: number
  }
  radius: number // in meters
  organizationId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  userId: string
  user: {
    id: string
    name: string
    email: string
    department?: string
  }
  status: AttendanceStatus
  
  // Check-in/out details
  checkInTime?: string
  checkOutTime?: string
  checkInLocation?: {
    latitude: number
    longitude: number
  }
  checkOutLocation?: {
    latitude: number
    longitude: number
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

