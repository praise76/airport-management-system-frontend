import { api } from "./client";
import type { 
  ContractorOrganization, 
  ContractorPersonnel, 
  PassApplication, 
  RegisterContractorRequest,
  RegisterPersonnelRequest,
  ApplyPassRequest 
} from "@/types/contractor";

export async function registerContractorOrganization(input: RegisterContractorRequest): Promise<ContractorOrganization> {
  const res = await api.post("/contractors/organizations", input);
  return res.data;
}

export async function listContractorOrganizations(params?: { status?: string }): Promise<ContractorOrganization[]> {
  const res = await api.get("/contractors/organizations", { params });
  return res.data;
}

export async function verifyContractorOrganization(id: string): Promise<void> {
  await api.post(`/contractors/organizations/${id}/verify`);
}

export async function registerContractorPersonnel(input: RegisterPersonnelRequest): Promise<ContractorPersonnel> {
  const res = await api.post("/contractors/personnel", input);
  return res.data;
}

export async function applyForPass(input: ApplyPassRequest): Promise<PassApplication> {
  const res = await api.post("/contractors/pass/apply", input);
  return res.data;
}

export async function reviewPassApplication(id: string, level: string, input: { decision: string; comments: string }): Promise<void> {
  await api.post(`/contractors/pass/${id}/review/${level}`, input);
}

export async function logEntry(input: { passApplicationId: string; personnelId: string; entryGate: string; entryMethod: string }): Promise<void> {
  await api.post("/contractors/entry", input);
}

export async function logExit(input: { entryLogId: string; exitGate: string; workPerformed: string }): Promise<void> {
  await api.post("/contractors/exit", input);
}

export async function reportViolation(input: { passApplicationId: string; personnelId: string; violationType: string; description: string; severity: string }): Promise<void> {
  await api.post("/contractors/violations", input);
}
