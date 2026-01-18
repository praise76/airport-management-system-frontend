import type { User } from "./user"
import type { AttendanceRecord } from "./attendance"
import type { RosterEntry } from "./roster"

export type ProfileUpdateRequest = {
  requestType: string
  currentData: Record<string, any>
  requestedData: Record<string, any>
  reason: string
}

export type LeaveApplication = {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  emergencyContact: string
  reliefStaffId?: string
  status: 'pending' | 'approved' | 'rejected'
}

export type ApplyLeaveRequest = Omit<LeaveApplication, 'id' | 'status'>

export type LeaveBalance = {
  leaveType: string
  entitled: number
  taken: number
  pending: number
  remaining: number
}

export type DocumentRequest = {
  requestType: string
  purpose: string
  addressedTo: string
  isUrgent: boolean
  requiredBy: string
}
