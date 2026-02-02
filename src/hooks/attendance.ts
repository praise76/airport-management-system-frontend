import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAttendance,
  getAttendanceRecord,
  getMyAttendanceToday,
  getAttendanceSummary,
  checkIn,
  checkOut,
  checkLocation,
  listGeofenceZones,
  createGeofenceZone,
  updateGeofenceZone,
  deleteGeofenceZone,
  type ListAttendanceParams,
  type CheckInRequest,
  type CheckOutRequest,
} from '@/api/attendance'
import type { GeofenceZone } from '@/types/attendance'
import { toast } from 'sonner'

export function useAttendance(params: ListAttendanceParams = {}) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => listAttendance(params),
  })
}

export function useAttendanceRecord(id: string) {
  return useQuery({
    queryKey: ['attendance', id],
    queryFn: () => getAttendanceRecord(id),
    enabled: !!id,
  })
}

export function useMyAttendanceToday() {
  return useQuery({
    queryKey: ['attendance', 'me', 'today'],
    queryFn: () => getMyAttendanceToday(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useAttendanceSummary(date?: string) {
  return useQuery({
    queryKey: ['attendance', 'summary', date],
    queryFn: () => getAttendanceSummary(date),
  })
}

export function useGeofenceZones() {
  return useQuery({
    queryKey: ['geofence-zones'],
    queryFn: () => listGeofenceZones(),
  })
}

export function useCheckLocation(lat?: number, lng?: number) {
  return useQuery({
    queryKey: ['attendance', 'check-location', lat, lng],
    queryFn: () => checkLocation(lat!, lng!),
    enabled: !!lat && !!lng,
    refetchInterval: 60000, // Poll every 1 minute
  })
}

export function useCheckIn() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CheckInRequest) => checkIn(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      queryClient.invalidateQueries({ queryKey: ['messaging', 'conversations'] })
      toast.success('Checked in successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check in')
    },
  })
}

export function useCheckOut() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (input: CheckOutRequest) => checkOut(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
      toast.success('Checked out successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to check out')
    },
  })
}

export function useCreateGeofenceZone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Partial<GeofenceZone>) => createGeofenceZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-zones'] })
      toast.success('Geofence zone created')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create zone')
    },
  })
}

export function useUpdateGeofenceZone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GeofenceZone> }) => updateGeofenceZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-zones'] })
      toast.success('Geofence zone updated')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update zone')
    },
  })
}

export function useDeleteGeofenceZone() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteGeofenceZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-zones'] })
      toast.success('Geofence zone deleted')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete zone')
    },
  })
}

