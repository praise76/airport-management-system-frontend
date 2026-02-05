export type LeaveType = "Annual" | "Sick" | "Compassionate" | "Unpaid" | "Maternity" | "Paternity";

export type LeaveStatus = "pending" | "approved" | "rejected";

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
    handoverNotes?: string;
    rejectionReason?: string;
    staffName?: string; // For manager view
    staffId?: string; // For manager view
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
