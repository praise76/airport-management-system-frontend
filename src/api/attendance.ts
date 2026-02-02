import { api } from './client'
import type {
  AttendanceRecord,
  AttendanceSummary,
  DailyAttendance,
  GeofenceZone,
  Paginated,
  CheckInResponse,
  CheckOutResponse,
  CheckLocationResponse,
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

export async function getMyAttendanceToday(): Promise<DailyAttendance> {
  const res = await api.get('/attendance/me/today')
  return res.data.data
}

export async function getAttendanceSummary(date?: string): Promise<AttendanceSummary> {
  const res = await api.get('/attendance/summary', {
    params: { date },
  })
  return res.data
}

export type CheckInRequest = {
  lat: number
  lng: number
  terminalCode?: string // [NEW]
  zoneId?: string
  notes?: string
}

export type CheckOutRequest = {
  lat: number
  lng: number
  notes?: string
}

export async function checkIn(input: CheckInRequest): Promise<CheckInResponse> {
  const res = await api.post('/attendance/check-in', input)
  return res.data.data
}

export async function checkOut(input: CheckOutRequest): Promise<CheckOutResponse> {
  const res = await api.post('/attendance/check-out', input)
  return res.data.data
}

export async function checkLocation(lat: number, lng: number): Promise<CheckLocationResponse> {
  const res = await api.post('/attendance/check-location', { lat, lng })
  return res.data.data
}

export type AutoClockRequest = {
  userId: string
  organizationId: string
  lat: number
  lng: number
}

export async function autoClock(input: AutoClockRequest): Promise<void> {
  await api.post('/attendance/auto-clock', input)
}

export async function listGeofenceZones(): Promise<GeofenceZone[]> {
  const res = await api.get('/geofence/zones')
  return res.data.data || res.data
}

export async function createGeofenceZone(data: Partial<GeofenceZone>): Promise<GeofenceZone> {
  const res = await api.post('/geofence/zones', data)
  return res.data.data
}

export async function updateGeofenceZone(id: string, data: Partial<GeofenceZone>): Promise<GeofenceZone> {
  const res = await api.patch(`/geofence/zones/${id}`, data)
  return res.data.data
}

export async function deleteGeofenceZone(id: string): Promise<void> {
  await api.delete(`/geofence/zones/${id}`)
}

