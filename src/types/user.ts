export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  organizationId: string
  departmentId?: string
  roles?: string[]
  employeeId?: string
  /** The departments this person is the set head of: documents for them go to this person. */
  headOf?: Array<{ id: string; name: string; code: string }>
  /** Grade level 1-15 (sets annual leave). */
  gradeLevel?: number | null
  createdAt: string
  updatedAt: string
}

export type UpdateUserRequest = {
  firstName?: string
  lastName?: string
  phone?: string
  role?: string
  departmentId?: string
}

export type UserListResponse = {
  data: User[]
  total: number
  page: number
  limit: number
}
