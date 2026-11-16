import type { BoardPlace } from "./boardScope";

/** A unit that covers every terminal (its terminal list has them all) works around the airport. */
export function worksAroundAirport(
	unit: { terminalCodes?: string | null } | undefined,
	terminalCount: number,
) {
	if (!unit?.terminalCodes || !terminalCount) return false;
	try {
		const codes = JSON.parse(unit.terminalCodes);
		return Array.isArray(codes) && codes.length >= terminalCount;
	} catch {
		return false;
	}
}

/**
 * Where a person works, from their department: the ADO office covers the whole airport; a head of
 * terminal (Terminal Management) or a Terminal Operations Officer runs one terminal; a unit that
 * covers every terminal works around the airport.
 */
export function placeOf(
	departments: {
		id: string;
		code?: string;
		terminalCodes?: string | null;
		parentDepartmentId?: string | null;
	}[],
	departmentId: string | null | undefined,
	terminalCount: number,
): BoardPlace {
	const chain: (typeof departments)[number][] = [];
	for (
		let d = departments.find((x) => x.id === departmentId);
		d;
		d = departments.find((x) => x.id === d?.parentDepartmentId)
	)
		chain.push(d);
	// Heads of terminal, Terminal Operations Officers and Airport Duty Officers each run one terminal.
	const runs = chain.find((d) => /^(TMG|TOP|ADO)-/.test(d.code ?? ""));
	if (runs?.terminalCodes) {
		try {
			const codes = JSON.parse(runs.terminalCodes);
			if (Array.isArray(codes) && codes.length === 1)
				return { runsTerminal: codes[0] };
		} catch {}
	}
	return { roaming: worksAroundAirport(chain[0], terminalCount) };
}
