import { useMemo } from "react";
import { useDepartments } from "@/hooks/departments";
import { useTerminals } from "@/hooks/terminals";
import { placeOf } from "@/lib/boardPlace";
import { useAuthStore } from "@/stores/auth";

/**
 * The one terminal this person runs (head of terminal, Terminal Operations Officer, Airport Duty
 * Officer: their department is coded TMG-/TOP-/ADO- and names a terminal), or null. Same rule as the
 * duty board and the server's attendance registry.
 */
export function useRunsTerminal(): string | null {
	const user = useAuthStore((s) => s.user);
	const isStaff = !!user && (user as any).type !== "stakeholder";
	const { data: deptData } = useDepartments({ limit: 300 });
	const { data: terminals } = useTerminals();
	return useMemo(() => {
		if (!isStaff) return null;
		const departments = ((deptData as any)?.data ?? deptData ?? []) as any[];
		return placeOf(departments, (user as any)?.departmentId, terminals?.length ?? 0).runsTerminal ?? null;
	}, [isStaff, deptData, terminals, user]);
}
