export type Group = {
  id: string
  departmentId: string
  groupType: 'department' | 'project' | 'other'
  name: string
  visibility: 'public' | 'private'
  isAutoManaged?: boolean
  autoIncludeRule?: 'all_department' | 'managers_only'
  createdAt: string
  updatedAt: string
}

export type GroupMember = {
  id: string
  groupId: string
  userId: string
  role: 'member' | 'admin'
  joinedAt: string
  isAutoAdded?: boolean
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
  }
}

export type CreateGroupRequest = {
  departmentId: string
  groupType: string
  name: string
  visibility: string
}

export type AddMemberRequest = {
  userId: string
  role: string
}
