import { api } from "./client";
import type { Terminal, TerminalInput, TerminalUpdate, TerminalStats } from "@/types/terminal";

export async function getTerminals(): Promise<Terminal[]> {
  const res = await api.get("/terminals");
  return res.data.data;
}

export async function getTerminal(id: string): Promise<Terminal> {
  const res = await api.get(`/terminals/${id}`);
  return res.data.data;
}

export async function createTerminal(input: TerminalInput): Promise<Terminal> {
  const payload = {
    ...input,
    terminalName: input.name,
    terminalCode: input.code,
    terminalType: input.type,
    airportCode: input.airportCode,
    // Keep original keys if backend supports them optionally or ignores them, 
    // but ensuring the required ones are present with correct keys.
  };
  const res = await api.post("/terminals", payload);
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
