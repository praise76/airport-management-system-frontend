import { hasAnyRole, ROLE_GROUPS } from "@/lib/access";
import type { Member, MessageAcknowledgment } from "@/types/messaging";

export type AckPerson = { userId: string; name: string; at?: string };

export type AckSummary = {
	acknowledged: AckPerson[];
	pending: AckPerson[];
	/** Everyone asked to acknowledge: the chat's members except the sender. */
	expected: number;
};

const nameOf = (p: { firstName?: string; lastName?: string }) =>
	`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "Unknown";

/**
 * Who has acknowledged an alert and who still has to. The sender is never counted as pending.
 * Members are optional: without them only the acknowledged list is known.
 */
export function summarizeAcknowledgments(
	senderId: string,
	acks: MessageAcknowledgment[],
	members?: Member[],
): AckSummary {
	const seen = new Set<string>();
	const acknowledged: AckPerson[] = [];
	for (const a of [...acks].sort((x, y) =>
		x.acknowledgedAt.localeCompare(y.acknowledgedAt),
	)) {
		if (a.userId === senderId || seen.has(a.userId)) continue;
		seen.add(a.userId);
		acknowledged.push({
			userId: a.userId,
			name: nameOf(a),
			at: a.acknowledgedAt,
		});
	}
	const others = (members ?? []).filter((m) => m.userId !== senderId);
	const pending = others
		.filter((m) => !seen.has(m.userId))
		.map((m) => ({ userId: m.userId, name: nameOf(m) }))
		.sort((a, b) => a.name.localeCompare(b.name));
	const expected = members ? others.length : acknowledged.length;
	return { acknowledged, pending, expected };
}

/** Whether this person has acknowledged. */
export function hasAcknowledged(
	userId: string | undefined,
	acks: MessageAcknowledgment[],
): boolean {
	return !!userId && acks.some((a) => a.userId === userId);
}

/**
 * Who may send an emergency alert that everyone must acknowledge: supervisors and above
 * (station and team heads, heads of unit and department, ACOS, RGM, admins).
 */
export function canSendAlert(
	user: { role?: string; roles?: string[] } | null | undefined,
) {
	return hasAnyRole(user, ROLE_GROUPS.supervisors);
}
