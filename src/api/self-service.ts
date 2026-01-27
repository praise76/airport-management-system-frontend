import { api } from "./client";
import type { User } from "@/types/user";
import type { AttendanceRecord } from "@/types/attendance";
import type { RosterEntry } from "@/types/roster";
import type { 
  ProfileUpdateRequest, 
  ApplyLeaveRequest, 
  LeaveBalance, 
  DocumentRequest,
  LeaveApplication
} from "@/types/self-service";

export async function getMyProfile(): Promise<User> {
  const res = await api.get("/self-service/profile");
  return res.data.data ?? res.data;
}

export async function requestProfileUpdate(input: ProfileUpdateRequest): Promise<void> {
  await api.post("/self-service/profile/update", input);
}

export async function getMyUpdateRequests(): Promise<ProfileUpdateRequest[]> {
  const res = await api.get("/self-service/profile/requests");
  return res.data;
}

export async function applyForLeave(input: ApplyLeaveRequest): Promise<LeaveApplication> {
  const res = await api.post("/self-service/leave/apply", input);
  return res.data;
}

export async function getMyLeaveBalance(): Promise<{ data: LeaveBalance[] }> {
  const res = await api.get("/self-service/leave/balance");
  return res.data;
}

export async function cancelLeaveRequest(id: string, reason: string): Promise<void> {
  await api.post(`/self-service/leave/${id}/cancel`, { reason });
}

export async function reviewLeaveRequest(id: string, level: string, input: { approved: boolean; comments: string }): Promise<void> {
  await api.post(`/self-service/leave/${id}/review/${level}`, input);
}

export async function requestDocument(input: DocumentRequest): Promise<void> {
  await api.post("/self-service/documents/request", input);
}

export async function getMyAttendance(params?: { startDate?: string; endDate?: string }): Promise<AttendanceRecord[]> {
  const res = await api.get("/self-service/attendance", { params });
  return res.data;
}

export async function getMyRoster(params?: { startDate?: string; endDate?: string }): Promise<RosterEntry[]> {
  const res = await api.get("/self-service/roster", { params });
  return res.data;
}
