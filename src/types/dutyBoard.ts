export interface DutyStaff {
  id: string;
  name: string;
  avatar: string | null;
  position: string;
  shiftStart: string;
  shiftEnd: string;
  checkedIn: boolean;
  checkedInAt: string | null; // ISO Date
  isLate: boolean;
  /** Not at post yet, but the shift only just started (15 min grace): expected, not overdue. */
  withinGrace?: boolean;
}

export interface DutyUnit {
  id: string;
  name: string;
  location: string;
  minStaff: number;
  /** 'awaiting': the people still missing are inside their grace period, so nothing to act on yet. */
  coverageStatus: 'adequate' | 'awaiting' | 'understaffed' | 'critical';
  onDutyStaff: DutyStaff[];
}

export interface DutyDepartment {
  id: string;
  name: string;
  onDutyCount: number;
  scheduledCount: number;
  currentShift: string;
  units: DutyUnit[];
}

export interface ContractorPerson {
  id: string;
  name: string;
  photo: string | null;
  role: string;
  currentLocation: string;
  entryTime: string; // ISO Date
}

export interface ContractorOrg {
  orgId: string;
  organizationName: string;
  contractType: string;
  onDutyPersonnel: ContractorPerson[];
}

export interface DutyBoardResponse {
  departments: DutyDepartment[];
  contractors: ContractorOrg[];
  lastUpdated: string;
  totalOnDuty: number;
  totalScheduled: number;
}
