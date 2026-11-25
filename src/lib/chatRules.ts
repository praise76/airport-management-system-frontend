import type { Department } from "@/types/department";

/**
 * Which check-in chats a person should see (rule confirmed by the airport, 24 Nov 2026):
 * - department and unit groups are permanent;
 * - station channels are for AVSEC only;
 * - the extra "<Unit> Unit" chat that check-in adds duplicates the permanent unit group.
 *
 * The server still creates these chats; until it stops, the app hides the ones the rule excludes.
 */
type ChatLike = { settings?: Record<string, unknown> | null };

const AVSEC = /aviation security|avsec/i;

/** Codes of AVSEC and every unit and station under it. */
export function avsecCodes(departments: Department[] | undefined): Set<string> {
	const all = departments ?? [];
	const byId = new Map(all.map((d) => [d.id, d]));
	const underAvsec = (d?: Department): boolean => {
		for (let x = d, i = 0; x && i < 10; x = x.parentDepartmentId ? byId.get(x.parentDepartmentId) : undefined, i++)
			if (AVSEC.test(x.name ?? "") || AVSEC.test(String((x as { code?: string }).code ?? ""))) return true;
		return false;
	};
	const codes = new Set<string>();
	for (const d of all) {
		const code = String((d as { code?: string }).code ?? "").toUpperCase();
		if (code && underAvsec(d)) codes.add(code);
	}
	return codes;
}

/** The unit code a channel belongs to, from its channel code ("WLDMG-...", "PSCRN-UNIT"). */
export function channelUnitCode(chat: ChatLike): string | null {
	const code = String(chat.settings?.channelCode ?? "");
	const i = code.indexOf("-");
	return i > 0 ? code.slice(0, i).toUpperCase() : null;
}

/** False for a chat the rule says this person should not see. Departments still loading: show everything. */
export function showChat(chat: ChatLike, avsec: Set<string> | null): boolean {
	const s = chat.settings ?? {};
	if (s.isUnitChannel) return false; // duplicate of the permanent unit group
	if (!avsec) return true;
	if (s.isStationChannel || s.isStationMasterChannel) {
		const unit = channelUnitCode(chat);
		return unit === null || avsec.has(unit);
	}
	return true;
}
