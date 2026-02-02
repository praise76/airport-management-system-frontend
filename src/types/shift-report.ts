export interface ShiftReport {
  id: string
  userId: string
  shiftId?: string
  summary: string
  passengersProcessed?: number
  incidentsCount?: number
  equipmentStatus?: Record<string, string>
  observations?: string
  challenges?: string
  recommendations?: string
  handoverNotes?: string
  urgentItems?: string
  attachments?: string[]
  registryNumber?: string // SR/AVSEC/YYYY/XXXXXX
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  shiftDate?: string
  shiftType?: string
  submittedBy?: string
  createdAt: string
  updatedAt: string
}

export interface ShiftReportInput {
  summary: string
  passengersProcessed?: number
  incidentsCount?: number
  equipmentStatus?: Record<string, string>
  observations?: string
  challenges?: string
  recommendations?: string
  handoverNotes?: string
  urgentItems?: string
  attachments?: string[]
}
