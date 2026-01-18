export type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  organizationId: string
  departmentId?: string
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
