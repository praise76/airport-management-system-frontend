import { api } from "./client";
import type { Group, CreateGroupRequest, AddMemberRequest } from "@/types/group";

export async function listGroups(params?: { departmentId?: string; groupType?: string; visibility?: string }): Promise<Group[]> {
  const res = await api.get("/groups", { params });
  return res.data;
}

export async function createGroup(input: CreateGroupRequest): Promise<Group> {
  const res = await api.post("/groups", input);
  return res.data;
}

export async function addGroupMember(groupId: string, input: AddMemberRequest): Promise<void> {
  await api.post(`/groups/${groupId}/members`, input);
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await api.delete(`/groups/${groupId}/members/${userId}`);
}
