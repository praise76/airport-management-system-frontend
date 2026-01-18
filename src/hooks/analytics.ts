import { useQuery } from "@tanstack/react-query";
import * as AnalyticsApi from "@/api/analytics";

export function useAttendanceSummary(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["analytics", "attendance", "summary", params],
    queryFn: () => AnalyticsApi.getAttendanceSummary(params),
  });
}

export function useAttendanceByDept(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["analytics", "attendance", "dept", params],
    queryFn: () => AnalyticsApi.getAttendanceByDepartment(params),
  });
}

export function useRosterPerformance(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["analytics", "roster", params],
    queryFn: () => AnalyticsApi.getRosterPerformance(params),
  });
}

export function useDocumentMetrics(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ["analytics", "documents", params],
    queryFn: () => AnalyticsApi.getDocumentMetrics(params),
  });
}

export function useDepartmentPerformance() {
  return useQuery({
    queryKey: ["analytics", "departments", "performance"],
    queryFn: () => AnalyticsApi.getDepartmentPerformance(),
  });
}
