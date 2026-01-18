import { api } from "./client";
import type {
  DocumentFlowReport,
  AttendanceSummaryReport,
  AttendanceTrendsReport,
  TasksSummaryReport,
  InspectionsSummaryReport,
  StakeholdersSummaryReport,
  StaffSummaryReport,
  RosterSummaryReport,
  ExecutiveDashboardReport,
  ReportParams,
} from "@/types/report";

// Documents
export async function getDocumentFlowReport(params?: ReportParams): Promise<DocumentFlowReport> {
  const res = await api.get("/reports/documents/flow", { params });
  return res.data.data;
}

// Attendance
export async function getAttendanceSummaryReport(params?: ReportParams): Promise<AttendanceSummaryReport> {
  const res = await api.get("/reports/attendance/summary", { params });
  return res.data.data;
}

export async function getAttendanceTrendsReport(params?: ReportParams): Promise<AttendanceTrendsReport> {
  const res = await api.get("/reports/attendance/trends", { params });
  return res.data.data;
}

// Tasks
export async function getTasksSummaryReport(params?: ReportParams): Promise<TasksSummaryReport> {
  const res = await api.get("/reports/tasks/summary", { params });
  return res.data.data;
}

// Inspections
export async function getInspectionsSummaryReport(params?: ReportParams): Promise<InspectionsSummaryReport> {
  const res = await api.get("/reports/inspections/summary", { params });
  return res.data.data;
}

// Stakeholders
export async function getStakeholdersSummaryReport(): Promise<StakeholdersSummaryReport> {
  const res = await api.get("/reports/stakeholders/summary");
  return res.data.data;
}

// Staff
export async function getStaffSummaryReport(): Promise<StaffSummaryReport> {
  const res = await api.get("/reports/staff/summary");
  return res.data.data;
}

// Roster
export async function getRosterSummaryReport(params?: ReportParams): Promise<RosterSummaryReport> {
  const res = await api.get("/reports/roster/summary", { params });
  return res.data.data;
}

// Executive Dashboard
export async function getExecutiveDashboard(): Promise<ExecutiveDashboardReport> {
  const res = await api.get("/reports/executive/dashboard");
  return res.data.data;
}
