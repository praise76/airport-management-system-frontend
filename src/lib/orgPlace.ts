/**
 * Where a person sits in the organisation: their department (always the top-level one),
 * and, when they belong lower down, the unit and station under it.
 * Staff are attached to whatever level they work at, so a profile showed "Passenger Screening"
 * or "TDT Departure Screening" where the department (Aviation Security) belongs.
 */
export interface OrgNode {
	id: string;
	name: string;
	parentDepartmentId?: string | null;
}

export interface OrgPlace {
	department?: string;
	unit?: string;
	station?: string;
}

export function orgPlace(
	departmentId: string | null | undefined,
	departments: OrgNode[] | undefined,
): OrgPlace {
	if (!departmentId || !departments?.length) return {};
	const byId = new Map(departments.map((d) => [d.id, d]));
	const chain: OrgNode[] = [];
	let d = byId.get(departmentId);
	while (d && chain.length < 6) {
		chain.unshift(d);
		d = d.parentDepartmentId ? byId.get(d.parentDepartmentId) : undefined;
	}
	const [department, unit, station] = chain;
	return {
		department: department?.name,
		unit: unit?.name,
		station: station?.name,
	};
}

/** "Passenger Screening · TDT Departure Screening", or "" when the person sits at department level. */
export function unitAndStation(place: OrgPlace): string {
	return [place.unit, place.station].filter(Boolean).join(" · ");
}
