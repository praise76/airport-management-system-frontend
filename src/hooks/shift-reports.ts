import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createShiftReport, getMyReports, getShiftReport } from '@/api/shift-reports'
import type { ShiftReportInput } from '@/types/shift-report'

export function useCreateShiftReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ShiftReportInput) => createShiftReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shift-reports'] })
    },
  })
}

export function useMyShiftReports(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['my-shift-reports', params],
    queryFn: () => getMyReports(params),
  })
}

export function useShiftReport(id: string) {
  return useQuery({
    queryKey: ['shift-report', id],
    queryFn: () => getShiftReport(id),
    enabled: !!id,
  })
}
