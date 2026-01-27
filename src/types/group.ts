export type Group = {
  id: string
  departmentId: string
  groupType: 'department' | 'project' | 'other'
  groupName: string
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
}

export type CreateGroupRequest = {
  departmentId: string
  groupType: string
  groupName: string
  visibility: string
}

export type AddMemberRequest = {
  userId: string
  role: string
}
