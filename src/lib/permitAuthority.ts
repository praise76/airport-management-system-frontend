import type { PermitTrailStep } from "@/types/stakeholder-portal";

/**
 * Who may decide an access permit (product owner, 14 Nov 2026):
 * the Regional General Manager approves, then the Airport Chief of Security issues.
 * Visitor permits go straight to ACOS, who issues them alone. Nobody else approves or rejects.
 * A contractor names the department it works for when it applies. The permit goes to the RGM as
 * usual; that department's HOD is notified and confirms the contractor by sending a letter of
 * introduction. The RGM approves a contractor's permit only once that letter is in.
 */

type Position = { id: string; title?: string; code?: string | null };

const isCode = (p: Position, code: string) =>
	(p.code ?? "").toUpperCase() === code ||
	new RegExp(`\\(${code}\\)`, "i").test(p.title ?? "");

/** The RGM and ACOS offices among the positions. */
export function authorityOffices(positions: Position[] = []): {
	rgm?: Position;
	acos?: Position;
} {
	return {
		rgm: positions.find((p) => isCode(p, "RGM")),
		acos: positions.find((p) => isCode(p, "ACOS")),
	};
}

export type PermitStage =
	| "with_rgm" // RGM decides: approve and send to ACOS, or reject
	| "with_acos_ready" // ACOS may issue or reject
	| "with_acos_waiting" // ACOS holds it but the RGM has not approved yet
	| "with_rgm_waiting_hod" // a contractor's permit with the RGM, waiting for the HOD's letter
	| "elsewhere" // another office is working on it; nobody there decides
	| "decided";

export function permitStage(
	permit: {
		status: string;
		permitType?: string;
		currentOfficeId?: string;
		currentOfficeType?: string;
		rgmApprovedAt?: string;
		/** Set for a contractor: the department it works for. */
		sponsorDepartmentId?: string | null;
		/** When that department's HOD sent the letter of introduction. */
		introducedAt?: string | null;
	},
	offices: { rgm?: Position; acos?: Position },
	trail: PermitTrailStep[] = [],
): PermitStage {
	if (permit.status !== "pending") return "decided";
	const at = permit.currentOfficeId;
	const waitingForHod =
		!!permit.sponsorDepartmentId &&
		!permit.introducedAt &&
		!trail.some((s) => s.stepType === "introduced");
	if (offices.rgm && at === offices.rgm.id)
		return waitingForHod ? "with_rgm_waiting_hod" : "with_rgm";
	if (offices.acos && at === offices.acos.id) {
		const approved =
			permit.permitType === "visitor" ||
			!!permit.rgmApprovedAt ||
			trail.some(
				(s) =>
					s.stepType === "rgm_approved" ||
					(s.stepType === "forwarded" &&
						s.fromOfficeId === offices.rgm?.id &&
						s.toOfficeId === offices.acos?.id),
			);
		return approved ? "with_acos_ready" : "with_acos_waiting";
	}
	return "elsewhere";
}
