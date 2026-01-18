import { api } from "./client";
import type { User, UserListResponse, UpdateUserRequest } from "@/types/user";

export async function listUsers(params?: { page?: number; limit?: number; role?: string; departmentId?: string }): Promise<UserListResponse> {
  const res = await api.get("/users", { params });
  return res.data;
}

export async function getUser(id: string): Promise<User> {
  const res = await api.get(`/users/${id}`);
  return res.data.data ?? res.data;
}

export async function updateUser(id: string, input: UpdateUserRequest): Promise<User> {
  const res = await api.patch(`/users/${id}`, input);
  return res.data.data ?? res.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
