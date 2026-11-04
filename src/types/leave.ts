export type LeaveType = "Annual" | "Sick" | "Compassionate" | "Unpaid" | "Maternity" | "Paternity";

/** pending → supervisor_approved → hod_approved → hr_approved, or rejected / cancelled. */
export type LeaveStatus =
    | "pending"
    | "supervisor_approved"
    | "hod_approved"
    | "hr_approved"
    | "approved"
    | "rejected"
    | "cancelled";

/** The approval step a manager is acting at. */
export type ApprovalLevel = "supervisor" | "hod" | "hr";

export interface LeaveBalance {
    leaveType: LeaveType;
    entitled: number;
    taken: number;
    remaining: number;
}

export interface LeaveApplication {
    id: string;
    applicationNumber: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: LeaveStatus;
    createdAt: string;
    handoverToUserId?: string;
    handoverToName?: string;
    handoverNotes?: string;
    rejectionReason?: string;
    staffName?: string; // For manager view
    staffId?: string; // For manager view
    level?: ApprovalLevel; // For manager view: the step this request is waiting at
}

export interface CreateLeaveRequest {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
    handoverToUserId?: string;
    handoverNotes?: string;
    contactPhone?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
}

export interface CalculateDaysRequest {
    startDate: string;
    endDate: string;
}

export interface CalculateDaysResponse {
    days: number;
}
