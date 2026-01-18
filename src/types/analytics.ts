export type AttendanceSummary = {
  totalSessions: number
  eventBreakdown: {
    auto_in: number
    auto_out: number
    manual_in: number
  }
  dateRange: { startDate: string; endDate: string }
}

export type AttendanceByDept = {
  departmentName: string
  totalStaff: number
  totalCheckIns: number
  attendanceRate: number
}

export type RosterPerformance = {
  statusBreakdown: {
    present: number
    late: number
    absent: number
  }
  presentRate: number
  lateRate: number
  averageLateMinutes: number
}

export type DocumentMetrics = {
  totalDocumentsGenerated: number
  statusBreakdown: {
    generated: number
    distributed: number
    signed: number
  }
}

export type DepartmentPerformance = {
  departmentName: string
  staffCount: number
  documentsGenerated: number
}
