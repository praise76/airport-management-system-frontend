import type {
	PermitTrailStep,
	RoutedKind,
	RoutingFields,
	TrailStepType,
} from "@/types/stakeholder-portal";

/**
 * Office routing for permits, activities and invoices (Permit Office Tracking Brief, 10 Nov 2026).
 * Pure helpers shared by the API layer and the screens; one copy for all three kinds.
 */

const STEP_TYPES: readonly TrailStepType[] = [
	"submitted",
	"forwarded",
	"returned",
	"acknowledged",
	"approved",
	"rejected",
];

type OfficeLike = string | { id?: string; name?: string } | null | undefined;
const officeName = (o: OfficeLike) =>
	(typeof o === "string" ? o : o?.name) || undefined;
const officeId = (o: OfficeLike) =>
	(typeof o === "object" && o ? o.id : undefined) || undefined;

/** The holder fields as the server may send them (flat names or an object). */
export function readRouting(row: Record<string, any>): RoutingFields {
	const o = row.currentOffice as OfficeLike;
	return {
		currentOffice: officeName(o) ?? row.currentOfficeName ?? undefined,
		currentOfficeId: officeId(o) ?? row.currentOfficeId ?? undefined,
		currentOfficeSince: row.currentOfficeSince ?? undefined,
		currentOfficerId: row.currentOfficerId ?? undefined,
	};
}

/** One server step to the screen's shape. Unknown step types are dropped by `toTrail`. */
export function toTrailStep(
	row: Record<string, any>,
	index = 0,
): PermitTrailStep {
	return {
		stepNumber: row.stepNumber ?? index + 1,
		stepType: row.stepType ?? row.type,
		fromOffice: officeName(row.fromOffice) ?? row.fromOfficeName ?? undefined,
		toOffice:
			officeName(row.toOffice) ?? row.toOfficeName ?? row.office ?? undefined,
		toOfficeId: officeId(row.toOffice) ?? row.toOfficeId ?? undefined,
		at: row.createdAt ?? row.at,
		minute: row.minute ?? undefined,
		actorName: row.actorName ?? officeName(row.actor) ?? undefined,
		toOfficerName: row.toOfficerName ?? officeName(row.toOfficer) ?? undefined,
	};
}

/** Ordered, oldest first. */
export function toTrail(rows: unknown): PermitTrailStep[] {
	const list = Array.isArray(rows)
		? rows
		: ((rows as any)?.steps ?? (rows as any)?.items ?? []);
	return (list as Record<string, any>[])
		.map(toTrailStep)
		.filter((s) => STEP_TYPES.includes(s.stepType) && !!s.at)
		.sort((a, b) => a.stepNumber - b.stepNumber || a.at.localeCompare(b.at));
}

/**
 * What a concessionaire may see: step type, office and time. The backend must already omit the
 * rest; this is a second guard so a server slip never reaches the portal's screens or cache.
 */
export function redactForConcessionaire(
	steps: PermitTrailStep[],
): PermitTrailStep[] {
	return steps.map(({ stepNumber, stepType, fromOffice, toOffice, at }) => ({
		stepNumber,
		stepType,
		fromOffice,
		toOffice,
		at,
	}));
}

type Decided = {
	createdAt: string;
	submittedAt?: string;
	status: string;
	approvedAt?: string;
	reviewedAt?: string;
} & RoutingFields;

/**
 * The trail we can show before the backend records movements (or for a record it hasn't
 * backfilled): "Submitted", then the final decision if there is one.
 */
export function fallbackTrail(item: Decided): PermitTrailStep[] {
	const steps: PermitTrailStep[] = [
		{
			stepNumber: 1,
			stepType: "submitted",
			toOffice:
				item.status === "approved" || item.status === "rejected"
					? undefined
					: item.currentOffice,
			at: item.submittedAt ?? item.createdAt,
		},
	];
	const decidedAt = item.approvedAt ?? item.reviewedAt;
	if ((item.status === "approved" || item.status === "rejected") && decidedAt)
		steps.push({
			stepNumber: 2,
			stepType: item.status,
			toOffice: item.currentOffice,
			at: decidedAt,
		});
	return steps;
}

const OPEN: Record<RoutedKind, readonly string[]> = {
	permits: ["pending"],
	activities: ["submitted", "under_review"],
	invoices: ["submitted", "under_review"],
};

/** Still moving between offices (not decided, expired, paid or a draft). */
export const isOpen = (kind: RoutedKind, status: string) =>
	OPEN[kind].includes(status);

type Actor =
	| {
			id?: string;
			userId?: string;
			role?: string;
			roles?: string[];
			departmentId?: string;
			unitDepartmentId?: string;
			positionId?: string;
	  }
	| null
	| undefined;

const isSuper = (u: Actor) =>
	u?.role === "super_admin" || !!u?.roles?.includes("super_admin");

/**
 * May this staff member forward, return, approve or reject the item? Only the office that
 * holds it (or the named officer, or a super admin). When the server sends no holder yet
 * (routing not deployed), nothing changes from today's behaviour.
 */
export function holdsItem(user: Actor, item: RoutingFields): boolean {
	if (!user) return false;
	if (isSuper(user)) return true;
	if (!item.currentOfficeId && !item.currentOfficerId) return true;
	const me = user.id ?? user.userId;
	if (item.currentOfficerId && me && item.currentOfficerId === me) return true;
	return (
		!!item.currentOfficeId &&
		[user.departmentId, user.unitDepartmentId, user.positionId].includes(
			item.currentOfficeId,
		)
	);
}

export const STEP_LABEL: Record<TrailStepType, string> = {
	submitted: "Submitted",
	forwarded: "Forwarded",
	returned: "Returned",
	acknowledged: "Received",
	approved: "Approved",
	rejected: "Rejected",
};

const dateOnly = (iso: string) =>
	new Date(iso).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

/** "Currently with: Airport Chief of Security, since 12 Nov 2026" */
export function currentlyWith(item: RoutingFields): string | null {
	if (!item.currentOffice) return null;
	return `Currently with: ${item.currentOffice}${item.currentOfficeSince ? `, since ${dateOnly(item.currentOfficeSince)}` : ""}`;
}

/** One line for a portal notice. Never includes a minute or a staff name. */
export function noticeText(n: {
	itemLabel: string;
	stepType: TrailStepType;
	office?: string;
}): string {
	switch (n.stepType) {
		case "approved":
			return `${n.itemLabel} was approved${n.office ? ` by ${n.office}` : ""}.`;
		case "rejected":
			return `${n.itemLabel} was rejected${n.office ? ` by ${n.office}` : ""}.`;
		case "returned":
			return `${n.itemLabel} was returned to ${n.office ?? "the previous office"}.`;
		case "submitted":
			return `${n.itemLabel} was received${n.office ? ` by ${n.office}` : ""}.`;
		default:
			return `${n.itemLabel} is now with ${n.office ?? "another office"}.`;
	}
}
