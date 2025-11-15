export type CertificationStatus = 'valid' | 'expiring' | 'expired'

export interface CertificationType {
  id: string
  organizationId: string
  name: string
  validityDays: number
  description?: string
  createdAt: string
  updatedAt: string
}

export interface UserCertification {
  id: string
  userId: string
  user?: {
    id: string
    name: string
    email: string
    department?: string
  }
  typeId: string
  type?: CertificationType
  issuedAt: string
  expiresAt: string
  status: CertificationStatus
  documentUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Paginated<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

