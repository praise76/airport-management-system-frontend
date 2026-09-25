import type {
	AttendanceSummaryReport,
	AttendanceTrendsReport,
	DocumentFlowReport,
	ExecutiveDashboardReport,
	InspectionsSummaryReport,
	ReportParams,
	RosterSummaryReport,
	StaffSummaryReport,
	StakeholdersSummaryReport,
	TasksSummaryReport,
} from "@/types/report";
import { api } from "./client";

export type ReportExportFormat = "csv" | "xlsx" | "pdf";

/**
 * Downloads a report in the given format and saves it to disk.
 *
 * The backend answers the exact same endpoint with either JSON (no `format` param -
 * see the `get*Report` functions below) or a file (`?format=csv|xlsx|pdf`), so this
 * reuses the report's own path rather than a separate export API.
 */
export async function downloadReportExport(
	path: string,
	format: ReportExportFormat,
	params?: ReportParams,
): Promise<void> {
	const res = await api.get(path, {
		params: { ...params, format },
		responseType: "blob",
	});

	const disposition: string = res.headers["content-disposition"] ?? "";
	const match = disposition.match(/filename="?([^";]+)"?/i);
	const filename = match?.[1] ?? `report.${format}`;

	const url = URL.createObjectURL(res.data as Blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

// Documents
export async function getDocumentFlowReport(
	params?: ReportParams,
): Promise<DocumentFlowReport> {
	const res = await api.get("/reports/documents/flow", { params });
	return res.data.data;
}

// Attendance
export async function getAttendanceSummaryReport(
	params?: ReportParams,
): Promise<AttendanceSummaryReport> {
	const res = await api.get("/reports/attendance/summary", { params });
	return res.data.data;
}

export async function getAttendanceTrendsReport(
	params?: ReportParams,
): Promise<AttendanceTrendsReport> {
	const res = await api.get("/reports/attendance/trends", { params });
	return res.data.data;
}

// Tasks
export async function getTasksSummaryReport(
	params?: ReportParams,
): Promise<TasksSummaryReport> {
	const res = await api.get("/reports/tasks/summary", { params });
	return res.data.data;
}

// Inspections
export async function getInspectionsSummaryReport(
	params?: ReportParams,
): Promise<InspectionsSummaryReport> {
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
export async function getRosterSummaryReport(
	params?: ReportParams,
): Promise<RosterSummaryReport> {
	const res = await api.get("/reports/roster/summary", { params });
	return res.data.data;
}

// Executive Dashboard
export async function getExecutiveDashboard(): Promise<ExecutiveDashboardReport> {
	const res = await api.get("/reports/executive/dashboard");
	return res.data.data;
}
