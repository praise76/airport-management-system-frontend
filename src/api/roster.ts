import { api } from "./client";
import type { Roster, RosterEntry, CreateRosterRequest, AddRosterEntryRequest, SwapRequest } from "@/types/roster";

export async function listRosters(params?: { unitId?: string; status?: string }): Promise<Roster[]> {
  const res = await api.get("/roster", { params });
  return res.data;
}

export async function getMyRoster(): Promise<Roster> {
  const res = await api.get("/roster/my");
  return res.data;
}

export async function getTodaysRoster(): Promise<RosterEntry[]> {
  const res = await api.get("/roster/today");
  return res.data;
}

export async function createRoster(input: CreateRosterRequest): Promise<Roster> {
  const res = await api.post("/roster", input);
  return res.data;
}

export async function addRosterEntry(rosterId: string, input: AddRosterEntryRequest): Promise<RosterEntry> {
  const res = await api.post(`/roster/${rosterId}/entries`, input);
  return res.data;
}

export async function requestSwap(input: Omit<SwapRequest, 'id' | 'status'>): Promise<SwapRequest> {
  const res = await api.post("/roster/swap", input);
  return res.data;
}

export async function respondToSwap(swapId: string, input: { accepted: boolean; responseMessage: string }): Promise<void> {
  await api.post(`/roster/swap/${swapId}/respond`, input);
}
