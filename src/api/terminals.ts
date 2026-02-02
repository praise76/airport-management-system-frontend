import { api } from "./client";
import type { 
  Terminal, 
  TerminalInput, 
  TerminalUpdate, 
  TerminalStats,
  TerminalRepresentative,
  TerminalRepresentativeInput,
  TerminalReportInput
} from "@/types/terminal";

export async function getTerminals(): Promise<Terminal[]> {
  const res = await api.get("/terminals");
  return res.data.data;
}

export async function getTerminal(id: string): Promise<Terminal> {
  const res = await api.get(`/terminals/${id}`);
  return res.data.data;
}

export async function createTerminal(input: TerminalInput): Promise<Terminal> {
  const res = await api.post("/terminals", input);
  return res.data.data;
}

export async function updateTerminal(id: string, input: TerminalUpdate): Promise<Terminal> {
  const res = await api.patch(`/terminals/${id}`, input);
  return res.data.data;
}

export async function deleteTerminal(id: string): Promise<void> {
  await api.delete(`/terminals/${id}`);
}

export async function getTerminalStats(id: string): Promise<TerminalStats> {
  const res = await api.get(`/terminals/${id}/stats`);
  return res.data.data;
}

export async function getTerminalRepresentatives(terminalId: string): Promise<TerminalRepresentative[]> {
  const res = await api.get(`/terminals/${terminalId}/representatives`);
  return res.data
}

export async function addTerminalRepresentative(terminalId: string, input: TerminalRepresentativeInput): Promise<TerminalRepresentative> {
  const res = await api.post(`/terminals/${terminalId}/representatives`, input);
  return res.data.data;
}

export async function removeTerminalRepresentative(id: string): Promise<void> {
  await api.delete(`/terminals/representatives/${id}`);
}

export async function submitTerminalReport(terminalId: string, input: TerminalReportInput): Promise<void> {
  await api.post(`/terminals/${terminalId}/reports`, input);
}

export async function getTerminalPerformance(terminalId: string): Promise<any> {
    const res = await api.get(`/terminals/${terminalId}/performance`);
    return res.data.data;
}
