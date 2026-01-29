
export type RosterStatus = 'draft' | 'pending_approval' | 'approved' | 'active';
export type ShiftType = 'morning' | 'afternoon' | 'night';
export type AttendanceStatus = 'scheduled' | 'present' | 'late' | 'absent' | 'half_day';
export type EntryStatus = 'scheduled' | 'confirmed' | 'swapped' | 'completed';

export interface Roster {
  id: string; // UUID
  name: string; // "Security Team A - Jan 2024"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  unitId: string;
  departmentId: string;
  status: RosterStatus;
  notes?: string;
}

// ... (existing code)

export interface ShiftDefinition {
  id: string;
  name: string; // "Morning A"
  startTime: string; // "06:00"
  endTime: string; // "14:00"
  unitId?: string;
  organizationId: string;
  color?: string; // Optional UI color
}

export interface RosterEntry {
  id: string;
  userId: string;
  rosterId: string;
  dutyDate: string; // YYYY-MM-DD

  // Shift config
  shiftDefinitionId?: string;
  shiftDefinition?: ShiftDefinition;

  // Planned
  shift: ShiftType;
  shiftStartTime: string; // "08:00:00"
  shiftEndTime: string; // "16:00:00"
  dutyPosition?: string; // "Gate 1 Supervisor"
  dutyLocation?: string; // "Terminal 1"

  // Actual (Synced from Attendance Module)
  checkedInAt?: string; // ISO DateTime
  checkedOutAt?: string; // ISO DateTime
  attendanceStatus?: AttendanceStatus;
  lateMinutes: number; // Calculated automatically
  earlyDepartureMinutes: number; // Calculated automatically

  approvalStatus: EntryStatus;
  
  // Populated fields (optional, depending on API response)
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  targetUserId: string;
  entryToGiveId: string;
  entryToReceiveId?: string; // Optional for 2-way swap
  reason: string;
  status: 'pending' | 'accepted' | 'rejected' | 'approved';
  createdAt: string;
  
  // Populated
  requester?: { firstName: string; lastName: string };
  targetUser?: { firstName: string; lastName: string };
  entryToGive?: RosterEntry;
  entryToReceive?: RosterEntry;
}
