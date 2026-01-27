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
  unitId: string
  dutyDate: string
  shift: string
  shiftStartTime: string
  shiftEndTime: string
  dutyPosition: string
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
  unitId: string
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
  unitId: string
  templateId: string
  startDate: string
  endDate: string
  teams: RosterTeamConfig[]
  saveRoster: boolean // true = commit to DB, false = preview only
}

export type GenerateRosterResponse = {
  rosterId?: string // If saved
  entriesCount?: number
  entries: RosterEntry[] // For preview
}
