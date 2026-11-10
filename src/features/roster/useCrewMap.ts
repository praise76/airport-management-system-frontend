import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listCrewMembers, listCrews } from "./crews";

/**
 * staffId -> crew name for a unit, built from the unit's crews (Patterns & crews).
 *
 * Roster entries don't carry a crew/team label, so the Shift View said "3 Staff" and the
 * Staff View said "Staff" for everyone, even when the unit works in crews (QA, 10 Nov).
 * Screens use this map to label cells and rows with the crew. Works for ordinary staff too:
 * they may read their unit's groups and members.
 */
export function useCrewMap(unitId?: string | null): Map<string, string> {
	const crewsQ = useQuery({
		queryKey: ["crews", unitId],
		queryFn: () => listCrews(unitId ?? undefined),
		enabled: !!unitId,
		staleTime: 60_000,
	});
	const crews = crewsQ.data ?? [];
	const membersQ = useQueries({
		queries: crews.map((c) => ({
			queryKey: ["crews", c.id, "members"],
			queryFn: () => listCrewMembers(c.id),
			staleTime: 60_000,
		})),
	});
	const stamp = membersQ.map((q) => q.dataUpdatedAt).join(",");
	return useMemo(() => {
		const map = new Map<string, string>();
		crews.forEach((c, i) => {
			for (const m of membersQ[i]?.data ?? []) map.set(m.userId, c.name);
		});
		return map;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [crews, stamp]);
}

/** Natural crew order: "Crew A" < "Crew B"; people without a crew last. */
export const byCrew = (a?: string, b?: string) =>
	(a ? 0 : 1) - (b ? 0 : 1) || (a ?? "").localeCompare(b ?? "", undefined, { numeric: true });
