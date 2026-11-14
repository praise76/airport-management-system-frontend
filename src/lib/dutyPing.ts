import type { DutyUnit } from "@/types/dutyBoard";

/**
 * Who a ping from the board goes to: the people checked in at the post; if nobody has checked
 * in yet, everyone rostered there.
 */
export function pingTargets(unit: DutyUnit): { ids: string[]; who: string } {
	const staff = unit.onDutyStaff ?? [];
	const onPost = staff.filter((s) => s.checkedIn);
	return onPost.length
		? { ids: onPost.map((s) => s.id), who: "checked in at this post now" }
		: { ids: staff.map((s) => s.id), who: "rostered at this post (nobody has checked in yet)" };
}
