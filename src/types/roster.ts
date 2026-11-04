export type Roster = {
  id: string
  unitId: string
  rosterName: string
  startDate: string
  endDate: string
  rosterType: 'weekly' | 'monthly'
  status: 'draft' | 'active' | 'archived'
  entries: RosterEntry[]
}

export type RosterEntry = {
  id: string
  rosterId: string
  staffId: string
  unitDepartmentId: string

  dutyDate: string
  shift: string
  shiftStartTime: string
  shiftEndTime: string
  dutyPosition: string
  dutyLocation?: string
  terminalId?: string
  terminal?: { terminalCode?: string; terminalName?: string }
}

export type SwapRequest = {
  id: string
  requestingStaffId: string
  targetStaffId: string
  originalDutyDate: string
  proposedDutyDate: string
  swapReason: string
  status: 'pending' | 'accepted' | 'rejected'
}

export type CreateRosterRequest = {
  unitDepartmentId: string

  rosterName: string
  startDate: string
  endDate: string
  rosterType: string
}


export type AddRosterEntryRequest = Omit<RosterEntry, 'id' | 'rosterId'>

// --- Roster Templates ---

export type ShiftDefinition = {
  name: string
  startTime: string // HH:mm
  endTime: string   // HH:mm
  duration: number  // hours
  color: string     // hex code
}

export type ShiftPatternTemplate = {
  id: string
  name: string
  type: string
  shiftDefinitions: Record<string, ShiftDefinition> // e.g., { "MORNING": { ... } }
  rotationCycle: string[] // e.g., ["MORNING", "MORNING", "OFF", "OFF"]
  minStaffPerShift: number
  idealTeamSize: number
  createdAt: string
  updatedAt: string
}

export type CreateTemplateRequest = Omit<ShiftPatternTemplate, 'id' | 'createdAt' | 'updatedAt'>

// --- Roster Generation ---

export type RosterTeamConfig = {
  name: string
  memberIds: string[]
  offsetDays: number // Start rotation at index N
}

export type GenerateRosterRequest = {
  unitDepartmentId: string

  templateId: string
  startDate: string
  endDate: string
  teams: RosterTeamConfig[]
  saveRoster: boolean // true = commit to DB, false = preview only
  /** What to do when someone is on leave or already booked: refuse (default) or skip those days. */
  conflictResolution?: 'error' | 'skip'
}

/** Why the server will not roster a person on a day. */
export type RosterConflictType = 'on_leave' | 'double_booked' | 'duplicate_in_request'

export type RosterConflict = {
  staffId: string
  staffName: string
  dutyDate: string // YYYY-MM-DD
  type: RosterConflictType
  message: string
  leaveType?: string
  existingShift?: string
}

export type GenerateRosterResponse = {
  rosterId?: string // If saved
  entriesCount?: number
  skipped?: number // days left out because of conflicts (conflictResolution 'skip')
  entries: RosterEntry[] // For preview
  conflicts?: RosterConflict[]
}
