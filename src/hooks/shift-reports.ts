import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShiftReport, getMyReports, getShiftReport, approveShiftReport, consolidateShiftReports, getShiftReports } from '@/api/shift-reports'
import type { ShiftReportInput } from '@/types/shift-report'
import { toast } from 'sonner' // Adding toast for feedback

export function useCreateShiftReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ShiftReportInput) => createShiftReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shift-reports'] })
      toast.success('Shift report created')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create report')
    }
  })
}

export function useMyShiftReports(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['my-shift-reports', params],
    queryFn: () => getMyReports(params),
  })
}

export function useShiftReports(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: ['shift-reports', params],
    queryFn: () => getShiftReports(params),
  })
}

export function useShiftReport(id: string) {
  return useQuery({
    queryKey: ['shift-report', id],
    queryFn: () => getShiftReport(id),
    enabled: !!id,
  })
}

export function useApproveShiftReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments?: string }) => 
      approveShiftReport(id, comments),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['shift-report', id] })
      queryClient.invalidateQueries({ queryKey: ['my-shift-reports'] })
      toast.success('Shift report approved')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve report')
    }
  })
}

export function useConsolidateShiftReports() {
  return useMutation({
    mutationFn: (date: string) => consolidateShiftReports(date),
    onSuccess: () => {
      toast.success('Shift reports consolidated successfully')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to consolidate reports')
    }
  })
}
