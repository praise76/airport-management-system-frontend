import { useQuery } from "@tanstack/react-query";
import * as ReportsApi from "@/api/reports";
import type { ReportParams } from "@/types/report";

export function useDocumentFlowReport(params?: ReportParams) {
  return useQuery({
    queryKey: ["reports", "documents", "flow", params],
    queryFn: () => ReportsApi.getDocumentFlowReport(params),
  });
}

export function useAttendanceSummaryReport(params?: ReportParams) {
  return useQuery({
    queryKey: ["reports", "attendance", "summary", params],
    queryFn: () => ReportsApi.getAttendanceSummaryReport(params),
  });
}

export function useAttendanceTrendsReport(params?: ReportParams) {
  return useQuery({
    queryKey: ["reports", "attendance", "trends", params],
    queryFn: () => ReportsApi.getAttendanceTrendsReport(params),
  });
}

export function useTasksSummaryReport(params?: ReportParams) {
  return useQuery({
    queryKey: ["reports", "tasks", "summary", params],
    queryFn: () => ReportsApi.getTasksSummaryReport(params),
  });
}

export function useInspectionsSummaryReport(params?: ReportParams) {
  return useQuery({
    queryKey: ["reports", "inspections", "summary", params],
    queryFn: () => ReportsApi.getInspectionsSummaryReport(params),
  });
}

export function useStakeholdersSummaryReport() {
  return useQuery({
    queryKey: ["reports", "stakeholders", "summary"],
    queryFn: () => ReportsApi.getStakeholdersSummaryReport(),
  });
}

export function useStaffSummaryReport() {
  return useQuery({
    queryKey: ["reports", "staff", "summary"],
    queryFn: () => ReportsApi.getStaffSummaryReport(),
  });
}

export function useRosterSummaryReport(params?: ReportParams) {
  return useQuery({
    queryKey: ["reports", "roster", "summary", params],
    queryFn: () => ReportsApi.getRosterSummaryReport(params),
  });
}

export function useExecutiveDashboard() {
  return useQuery({
    queryKey: ["reports", "executive", "dashboard"],
    queryFn: () => ReportsApi.getExecutiveDashboard(),
  });
}
