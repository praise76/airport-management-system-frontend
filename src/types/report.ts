// Report Types based on OpenAPI spec

export interface DocumentFlowReport {
  total: number;
  byStage: Record<string, number>;
}

export interface AttendanceSummaryReport {
  total: number;
  byType: Record<string, number>;
}

export interface AttendanceTrendsReport {
  total: number;
  byDate: Record<string, Record<string, number>>;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

export interface TasksSummaryReport {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  completionRate: number;
}

export interface InspectionsSummaryReport {
  total: number;
  byStatus: Record<string, number>;
  byTemplate: Array<{ templateId: string; templateName: string; count: number }>;
  completionRate: number;
}

export interface StakeholdersSummaryReport {
  airlines: { total: number; active: number };
  vendors: { total: number; totalRatings: number; byRating: any[] };
  regulatory: { total: number; byAgency: Record<string, number>; byStatus: Record<string, number> };
}

export interface StaffSummaryReport {
  total: number;
  active: number;
  byRole: Record<string, number>;
  byDepartment: Array<{ departmentId: string; departmentName: string; count: number }>;
}

export interface RosterSummaryReport {
  activeRosters: number;
  scheduledShifts: number;
  shifts: {
    byAttendance: { present: number; late: number; absent: number };
  };
  lateStats: {
    totalLateEntries: number;
    totalLateMinutes: number;
    averageLateMinutes: number;
  };
}

export interface ExecutiveDashboardReport {
  generatedAt: string;
  organizationId: string;
  summary: {
    documents: any;
    attendance: any;
    tasks: any;
    inspections: any;
    stakeholders: any;
    staff: any;
    roster: any;
  };
  details: Record<string, any>;
}

export interface ReportParams {
  startDate?: string;
  endDate?: string;
}
