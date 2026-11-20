import { api } from "./client";
import type { 
  EffectivePermissions, 
  ActingAssignment, 
  CreateActingAssignmentRequest, 
  HandoverItem, 
  AuditAction, 
  ActingStatus 
} from "@/types/acting-hod";

export async function getEffectivePermissions(): Promise<EffectivePermissions> {
  const res = await api.get("/auth/me/effective-permissions");
  return (res.data?.data ?? res.data) as EffectivePermissions;
}

export async function createActingAssignment(data: CreateActingAssignmentRequest): Promise<ActingAssignment> {
  const res = await api.post("/acting-hod/assignments", data);
  return (res.data?.data ?? res.data) as ActingAssignment;
}

export async function updateAssignmentStatus(id: string, status: ActingStatus): Promise<ActingAssignment> {
  const res = await api.patch(`/acting-hod/assignments/${id}/status`, { status });
  return (res.data?.data ?? res.data) as ActingAssignment;
}

export async function addHandoverItem(id: string, item: { title: string; description?: string }): Promise<HandoverItem> {
  const res = await api.post(`/acting-hod/assignments/${id}/handover`, item);
  return (res.data?.data ?? res.data) as HandoverItem;
}

export async function getAuditActions(id: string): Promise<AuditAction[]> {
  const res = await api.get(`/acting-hod/assignments/${id}/actions`);
  return (res.data?.data ?? res.data) as AuditAction[];
}

/** One delegation: who covers whom, and from when to when. */
export async function getActingAssignment(id: string): Promise<ActingAssignment> {
  const res = await api.get(`/acting-hod/assignments/${id}`);
  return (res.data?.data ?? res.data) as ActingAssignment;
}
