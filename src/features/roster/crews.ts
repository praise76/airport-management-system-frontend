import { api } from "@/api/client";
import { addGroupMember, createGroup, listGroupMembers, listGroups, removeGroupMember } from "@/api/groups";
import { createGroupConversation } from "@/api/messaging";
import type { Group, GroupMember } from "@/types/group";
import type { ShiftPattern } from "./types";

/**
 * Crews: a named team (Crew A, B, C …) in a department that works one rotation pattern from
 * one start date. Staggering the start dates (see planCrews) gives 24-hour cover.
 *
 * Crews are stored as Groups, so they reuse group membership and can have a group chat.
 * The backend has no crew fields yet, so the pattern, start date and chat id are kept in a
 * tagged line at the end of the group's description. When the backend adds
 * `groupType: "crew"`, `shiftPatternId`, `crewStartDate` and `conversationId` (see
 * docs/QA_BACKEND_FIXES_2026-11-08.md), readCrewMeta prefers those fields.
 */
export type CrewMeta = {
	patternId: string;
	/** yyyy-mm-dd: the day this crew is on day 1 of the pattern. */
	startDate: string;
	/** Group chat for the crew, once created. */
	conversationId?: string;
};

export type Crew = {
	id: string;
	name: string;
	departmentId?: string | null;
	meta: CrewMeta;
};

const TAG = "[crew:v1]";

export function writeCrewDescription(meta: CrewMeta, text = "Rotation crew"): string {
	return `${text}\n${TAG}${JSON.stringify(meta)}`;
}

export function readCrewMeta(group: Partial<Group> & Record<string, any>): CrewMeta | null {
	if (group.shiftPatternId && group.crewStartDate) {
		return {
			patternId: group.shiftPatternId,
			startDate: String(group.crewStartDate).slice(0, 10),
			conversationId: group.conversationId ?? undefined,
		};
	}
	const desc: string = group.description ?? "";
	const at = desc.lastIndexOf(TAG);
	if (at < 0) return null;
	try {
		const meta = JSON.parse(desc.slice(at + TAG.length));
		return meta?.patternId && meta?.startDate ? (meta as CrewMeta) : null;
	} catch {
		return null;
	}
}

/** Whole days from a to b (yyyy-mm-dd), ignoring time zones and daylight saving. */
export function daysBetween(a: string, b: string): number {
	const [ay, am, ad] = a.split("-").map(Number);
	const [by, bm, bd] = b.split("-").map(Number);
	return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** yyyy-mm-dd plus n days. */
export function addDays(date: string, n: number): string {
	const [y, m, d] = date.split("-").map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** The shift code a crew works on `date`, or null before its start date. */
export function crewShiftOn(
	pattern: Pick<ShiftPattern, "cycleLengthDays" | "shiftSequenceJson">,
	startDate: string,
	date: string,
): string | null {
	const n = pattern.cycleLengthDays;
	const since = daysBetween(startDate, date);
	if (!n || since < 0) return null;
	const day = (since % n) + 1;
	return pattern.shiftSequenceJson.find((s) => s.day === day)?.shift ?? "off";
}

/** Crews grouped by the shift they work on `date` ("morning", "night", "off" …). */
export function crewsByShift(
	crews: Crew[],
	patterns: ShiftPattern[],
	date: string,
): Record<string, Crew[]> {
	const out: Record<string, Crew[]> = {};
	for (const c of crews) {
		const p = patterns.find((x) => x.id === c.meta.patternId);
		const code = p ? crewShiftOn(p, c.meta.startDate, date) : null;
		if (!code) continue;
		(out[code] ??= []).push(c);
	}
	return out;
}

/** Local date as yyyy-mm-dd. */
export const todayLocal = () => {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ---------------------------------------------------------------- API

export async function listCrews(departmentId?: string): Promise<Crew[]> {
	const groups = (await listGroups(departmentId ? { departmentId } : undefined)) ?? [];
	return groups
		.map((g: any) => ({ g, meta: readCrewMeta(g) }))
		.filter((x): x is { g: any; meta: CrewMeta } => !!x.meta)
		.map(({ g, meta }) => ({ id: g.id, name: g.name, departmentId: g.departmentId, meta }));
}

export async function createCrew(input: {
	name: string;
	departmentId: string;
	patternId: string;
	startDate: string;
	patternName?: string;
}): Promise<Crew> {
	const meta: CrewMeta = { patternId: input.patternId, startDate: input.startDate };
	const g: any = await createGroup({
		name: input.name,
		departmentId: input.departmentId,
		// The API has no "crew" type yet; cross_functional is the closest existing one.
		groupType: "cross_functional",
		visibility: "private",
		description: writeCrewDescription(
			meta,
			`Rotation crew${input.patternName ? ` on "${input.patternName}"` : ""}, starting ${input.startDate}`,
		),
	} as any);
	return { id: g.id, name: g.name ?? input.name, departmentId: input.departmentId, meta };
}

export async function updateCrewMeta(crew: Crew, meta: CrewMeta): Promise<void> {
	await api.patch(`/groups/${crew.id}`, {
		description: writeCrewDescription(meta, `Rotation crew, starting ${meta.startDate}`),
	});
}

export const listCrewMembers = (crewId: string): Promise<GroupMember[]> => listGroupMembers(crewId);
export const addCrewMember = (crewId: string, userId: string) => addGroupMember(crewId, { userId, role: "member" });
export const removeCrewMember = (crewId: string, userId: string) => removeGroupMember(crewId, userId);

/**
 * Put every member on the crew's pattern from the crew's start date. Returns who failed,
 * so one bad record doesn't hide the rest.
 */
export async function applyCrewPattern(crew: Crew, members: GroupMember[]) {
	const results = await Promise.allSettled(
		members.map((m) =>
			api.post("/roster/patterns/assign", {
				userId: m.userId,
				shiftPatternId: crew.meta.patternId,
				effectiveFrom: crew.meta.startDate,
			}),
		),
	);
	const failed = members.filter((_, i) => results[i].status === "rejected");
	return { assigned: members.length - failed.length, failed };
}

/** Create the crew's group chat with its current members and remember it on the crew. */
export async function createCrewChat(crew: Crew, members: GroupMember[]): Promise<string> {
	const convo = await createGroupConversation({
		name: crew.name,
		description: "Crew chat for shift handover and notices",
		memberIds: members.map((m) => m.userId),
		type: "group",
	});
	await updateCrewMeta(crew, { ...crew.meta, conversationId: convo.id });
	return convo.id;
}
