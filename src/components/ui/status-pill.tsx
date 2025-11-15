import { cn } from '@/lib/utils'
import { Badge } from './badge'

export type DocumentStatus = 
  | 'DRAFT'
  | 'PENDING'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ARCHIVED'

export type AttendanceStatus = 
  | 'CHECKED_IN'
  | 'CHECKED_OUT'
  | 'ABSENT'
  | 'ON_LEAVE'

export type CertificationStatus = 
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'PENDING_REVIEW'

type StatusType = DocumentStatus | AttendanceStatus | CertificationStatus | string

interface StatusPillProps {
  status: StatusType
  className?: string
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info'; label?: string }> = {
  // Document statuses
  DRAFT: { variant: 'secondary', label: 'Draft' },
  PENDING: { variant: 'warning', label: 'Pending' },
  IN_REVIEW: { variant: 'info', label: 'In Review' },
  APPROVED: { variant: 'success', label: 'Approved' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
  ARCHIVED: { variant: 'secondary', label: 'Archived' },
  
  // Attendance statuses
  CHECKED_IN: { variant: 'success', label: 'Checked In' },
  CHECKED_OUT: { variant: 'secondary', label: 'Checked Out' },
  ABSENT: { variant: 'destructive', label: 'Absent' },
  ON_LEAVE: { variant: 'info', label: 'On Leave' },
  
  // Certification statuses
  ACTIVE: { variant: 'success', label: 'Active' },
  EXPIRING_SOON: { variant: 'warning', label: 'Expiring Soon' },
  EXPIRED: { variant: 'destructive', label: 'Expired' },
  PENDING_REVIEW: { variant: 'warning', label: 'Pending Review' },
}

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] || { variant: 'default' as const, label: status }
  
  return (
    <Badge variant={config.variant} className={cn('font-medium', className)}>
      {config.label || status}
    </Badge>
  )
}

