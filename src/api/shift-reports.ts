import { api } from './client'
import type { ShiftReport, ShiftReportInput } from '@/types/shift-report'

export async function createShiftReport(input: ShiftReportInput): Promise<ShiftReport> {
  const res = await api.post('/shift-reports', input)
  return res.data.data // Assuming standard response wrapper
}

export async function getMyReports(params?: { page?: number; limit?: number }): Promise<{ data: ShiftReport[]; total: number }> {
  const res = await api.get('/shift-reports/my-reports', { params })
  return res.data
}

export async function getShiftReport(id: string): Promise<ShiftReport> {
  const res = await api.get(`/shift-reports/${id}`)
  return res.data.data
}
