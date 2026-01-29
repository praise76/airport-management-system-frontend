import { api } from "./client";
import type { User, UserListResponse, UpdateUserRequest } from "@/types/user";

// Correct endpoint: /admin/staff
export async function listUsers(params?: { page?: number; limit?: number; role?: string; departmentId?: string }): Promise<UserListResponse> {
  const res = await api.get("/admin/staff", { params });
  return res.data;
}

// Correct endpoint: /admin/staff/{id}
export async function getUser(id: string): Promise<User> {
  const res = await api.get(`/admin/staff/${id}`);
  return res.data.data ?? res.data;
}

// Correct endpoint: /admin/staff/{id} and method: PUT
export async function updateUser(id: string, input: UpdateUserRequest): Promise<User> {
  const res = await api.put(`/admin/staff/${id}`, input);
  return res.data.data ?? res.data;
}

// Correct endpoint: /admin/staff/{id}/deactivate (POST)
// Note: The backend does not have a hard DELETE endpoint for users, it uses deactivation.
export async function deleteUser(id: string): Promise<void> {
  await api.post(`/admin/staff/${id}/deactivate`);
}