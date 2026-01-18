export type AdminDashboardSummary = {
  totalStaff: number
  totalDepartments: number
  todayCheckedIn: number
  pendingLeaveRequests: number
  pendingDocumentRequests: number
  pendingPassApplications: number
}

export type HRDashboardSummary = {
  staffOnLeaveToday: number
  leaveByType: Record<string, number>
  documentRequestsByStatus: Record<string, number>
}

export type OpsDashboardSummary = {
  todayScheduledShifts: number
  todayRosterStatus: {
    present: number
    late: number
    absent: number
  }
  activeContractorPasses: number
}
