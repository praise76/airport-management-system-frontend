import { api } from './client'
import type {
  AttendanceRecord,
  AttendanceSummary,
  GeofenceZone,
  Paginated,
} from '@/types/attendance'

export type ListAttendanceParams = {
  page?: number
  pageSize?: number
  userId?: string
  date?: string
  status?: string
}

export async function listAttendance(
  params: ListAttendanceParams = {},
): Promise<Paginated<AttendanceRecord>> {
  const res = await api.get('/attendance', { params })
  return res.data
}

export async function getAttendanceRecord(id: string): Promise<AttendanceRecord> {
  const res = await api.get(`/attendance/${id}`)
  return res.data
}

export async function getMyAttendanceToday(): Promise<AttendanceRecord | null> {
  const res = await api.get('/attendance/me/today')
  return res.data
}

export async function getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  const res = await api.get('/attendance/summary', {
    params: { date },
  })
  return res.data
}

export type CheckInRequest = {
  latitude: number
  longitude: number
  notes?: string
}

export type CheckOutRequest = {
  latitude: number
  longitude: number
  notes?: string
}

export async function checkIn(input: CheckInRequest): Promise<AttendanceRecord> {
  const res = await api.post('/attendance/check-in', input)
  return res.data
}

export async function checkOut(input: CheckOutRequest): Promise<AttendanceRecord> {
  const res = await api.post('/attendance/check-out', input)
  return res.data
}

export async function listGeofenceZones(): Promise<GeofenceZone[]> {
  const res = await api.get('/geofence-zones')
  return res.data
}

