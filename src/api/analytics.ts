import { api } from "./client";
import type { 
  AttendanceSummary, 
  AttendanceByDept, 
  RosterPerformance, 
  DocumentMetrics, 
  DepartmentPerformance 
} from "@/types/analytics";

export async function getAttendanceSummary(params?: { startDate?: string; endDate?: string }): Promise<AttendanceSummary> {
  const res = await api.get("/analytics/attendance/summary", { params });
  return res.data;
}

export async function getAttendanceByDepartment(params?: { startDate?: string; endDate?: string }): Promise<{ data: AttendanceByDept[] }> {
  const res = await api.get("/analytics/attendance/by-department", { params });
  return res.data;
}

export async function getRosterPerformance(params?: { startDate?: string; endDate?: string }): Promise<RosterPerformance> {
  const res = await api.get("/analytics/roster/performance", { params });
  return res.data;
}

export async function getDocumentMetrics(params?: { startDate?: string; endDate?: string }): Promise<DocumentMetrics> {
  const res = await api.get("/analytics/documents", { params });
  return res.data;
}

export async function getDepartmentPerformance(): Promise<{ data: DepartmentPerformance[] }> {
  const res = await api.get("/analytics/departments/performance");
  return res.data;
}
