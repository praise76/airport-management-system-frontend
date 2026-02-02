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

export async function getShiftReports(params?: { page?: number; limit?: number; status?: string }): Promise<{ data: ShiftReport[]; total: number }> {
  const res = await api.get('/shift-reports', { params })
  return res.data
}

export async function getShiftReport(id: string): Promise<ShiftReport> {
  const res = await api.get(`/shift-reports/${id}`)
  return res.data.data
}

export async function approveShiftReport(id: string, comments?: string): Promise<ShiftReport> {
  const res = await api.post(`/shift-reports/${id}/approve`, { comments })
  return res.data.data
}

export async function consolidateShiftReports(date: string): Promise<any> {
  const res = await api.post('/shift-reports/consolidate', { date })
  return res.data.data
}
