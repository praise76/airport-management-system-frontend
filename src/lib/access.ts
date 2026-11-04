import { redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth";
import { getAccessToken } from "@/utils/auth";

/**
 * Role groups used by route guards and by screens that show or hide actions.
 * Role names from the backend can arrive in any case ("super_admin" or "SUPER_ADMIN"),
 * so every comparison goes through `getRoles`, which upper-cases them.
 */
export const ROLE_GROUPS = {
	admins: ["SUPER_ADMIN", "ORG_ADMIN", "ADMIN"],
	staffAdmins: ["SUPER_ADMIN", "ORG_ADMIN", "ADMIN", "HR"],
	management: ["SUPER_ADMIN", "ORG_ADMIN", "ADMIN", "RGM", "ACOS", "HOD"],
	rosterPlanners: ["SUPER_ADMIN", "ORG_ADMIN", "ADMIN", "HOD", "HOU"],
	supervisors: [
		"SUPER_ADMIN",
		"ORG_ADMIN",
		"ADMIN",
		"RGM",
		"ACOS",
		"HOD",
		"HOU",
		"SUPERVISOR",
		"HR",
	],
	registry: ["SUPER_ADMIN", "ORG_ADMIN", "REGISTRY_CLERK"],
	stakeholderOfficers: [
		"SUPER_ADMIN",
		"ORG_ADMIN",
		"ADMIN",
		"RGM",
		"ACOS",
		"HOD",
		"COMMERCIAL",
		"AVSEC",
	],
} as const;

type MaybeUser = {
	role?: string;
	roles?: string[];
	type?: string;
} | null | undefined;

export function getRoles(user: MaybeUser): string[] {
	if (!user) return [];
	const list = user.roles?.length ? user.roles : user.role ? [user.role] : [];
	return list.map((r) => String(r).toUpperCase());
}

export function hasAnyRole(user: MaybeUser, allowed: readonly string[]): boolean {
	const roles = getRoles(user);
	return roles.some((r) => allowed.includes(r));
}

/** A user who signed in through the external stakeholder (concessionaire) portal. */
export function isStakeholderUser(user: MaybeUser): boolean {
	return user?.type === "stakeholder";
}

/**
 * Route guard for pages in the internal FAAN staff app.
 *
 * - Not signed in: sends the visitor to the staff login.
 * - Signed in through the stakeholder portal: sends them back to their portal,
 *   so a concessionaire can never open internal screens such as Staff Management.
 * - `roles` given and the user has none of them: sends them to the staff dashboard.
 */
export function requireStaff(roles?: readonly string[]) {
	return () => {
		if (typeof window === "undefined") return;
		const token = getAccessToken();
		if (!token) throw redirect({ to: "/auth/login" });
		const user = useAuthStore.getState().user;
		if (isStakeholderUser(user)) throw redirect({ to: "/stakeholder/dashboard" });
		if (roles && !hasAnyRole(user, roles)) throw redirect({ to: "/" });
	};
}

/** Route guard for pages in the stakeholder portal (except login and registration). */
export function requireStakeholder() {
	return () => {
		if (typeof window === "undefined") return;
		const token = getAccessToken();
		const user = useAuthStore.getState().user;
		if (!token || !user) throw redirect({ to: "/stakeholder/login" });
		if (!isStakeholderUser(user)) throw redirect({ to: "/" });
	};
}
