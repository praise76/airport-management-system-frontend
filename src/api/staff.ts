import { api } from "./client";
import type {
  Role,
  StaffMember,
  CreateStaffInput,
  UpdateStaffInput,
} from "@/types/staff";

// Get available roles
export async function getRoles(): Promise<Role[]> {
  const res = await api.get("/admin/roles");
  return res.data.data.roles;
}

// Create staff member
export async function createStaff(data: CreateStaffInput): Promise<StaffMember> {
  const res = await api.post("/admin/staff", data);
  return res.data.data;
}

// List all staff
export async function listStaff(): Promise<StaffMember[]> {
  const res = await api.get("/admin/staff");
  return res.data.data;
}

// Get staff by ID
export async function getStaffById(id: string): Promise<StaffMember> {
  const res = await api.get(`/admin/staff/${id}`);
  return res.data.data;
}

// Update staff
export async function updateStaff(
  id: string,
  data: UpdateStaffInput
): Promise<StaffMember> {
  const res = await api.put(`/admin/staff/${id}`, data);
  return res.data.data;
}

// Deactivate staff
export async function deactivateStaff(id: string): Promise<StaffMember> {
  const res = await api.post(`/admin/staff/${id}/deactivate`);
  return res.data.data;
}
