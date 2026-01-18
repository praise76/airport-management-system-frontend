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
