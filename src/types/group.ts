export type Group = {
  id: string
  departmentId: string
  groupType: 'department' | 'project' | 'other'
  groupName: string
  visibility: 'public' | 'private'
  createdAt: string
  updatedAt: string
}

export type GroupMember = {
  id: string
  groupId: string
  userId: string
  role: 'member' | 'admin'
  joinedAt: string
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
