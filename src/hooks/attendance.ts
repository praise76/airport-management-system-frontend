import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listAttendance,
  getAttendanceRecord,
  getMyAttendanceToday,
  getAttendanceSummary,
  checkIn,
  checkOut,
  listGeofenceZones,
  type ListAttendanceParams,
  type CheckInRequest,
  type CheckOutRequest,
} from '@/api/attendance'
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

