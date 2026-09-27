import type {
	AddRosterEntryRequest,
	CreateRosterRequest,
	CreateTemplateRequest,
	GenerateRosterRequest,
	GenerateRosterResponse,
	Roster,
	RosterEntry,
	ShiftPatternTemplate,
	SwapRequest,
} from "@/types/roster";
import { api } from "./client";

// Every backend response is wrapped as { success, data } - most functions below read
// res.data (the whole envelope) instead of res.data.data (the actual payload), so
// every caller received `{ success: true, data: ... }` where it expected the payload
// itself. listTemplates/generateRoster already unwrapped correctly; the rest now match.

export async function listRosters(params?: {
	unitId?: string;
	status?: string;
}): Promise<Roster[]> {
	const res = await api.get("/roster", { params });
	return res.data.data;
}

// The backend returns a flat array of upcoming entries for this endpoint (see
// src/modules/roster/routes.ts on the backend), not a single roster object.
export async function getMyRoster(): Promise<RosterEntry[]> {
	const res = await api.get("/roster/my");
	return res.data.data;
}

// Scoped to the calling user (a single entry or null), not a team-wide list - see
// getTodayRoster(userId) in src/modules/roster/routes.ts on the backend.
export async function getTodaysRoster(): Promise<RosterEntry | null> {
	const res = await api.get("/roster/today");
	return res.data.data;
}

export async function createRoster(
	input: CreateRosterRequest,
): Promise<Roster> {
	const res = await api.post("/roster", input);
	return res.data.data;
}

export async function addRosterEntry(
	rosterId: string,
	input: AddRosterEntryRequest,
): Promise<RosterEntry> {
	const res = await api.post(`/roster/${rosterId}/entries`, input);
	return res.data.data;
}

export async function requestSwap(
	input: Omit<SwapRequest, "id" | "status">,
): Promise<SwapRequest> {
	const res = await api.post("/roster/swap", input);
	return res.data.data;
}

export async function respondToSwap(
	swapId: string,
	input: { accepted: boolean; responseMessage: string },
): Promise<void> {
	await api.post(`/roster/swap/${swapId}/respond`, input);
}

// --- Roster Templates ---

export async function listTemplates(): Promise<ShiftPatternTemplate[]> {
	const res = await api.get("/roster/templates");
	return res.data.data;
}

export async function createTemplate(
	input: CreateTemplateRequest,
): Promise<ShiftPatternTemplate> {
	const res = await api.post("/roster/templates", input);
	return res.data.data;
}

export async function generateRoster(
	input: GenerateRosterRequest,
): Promise<GenerateRosterResponse> {
	const res = await api.post("/roster/templates/generate", input);
	return res.data.data;
}
