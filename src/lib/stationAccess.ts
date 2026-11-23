/**
 * Which stations a person may check in at.
 *
 * A station belongs to a unit, and a unit to a department. Officers use their own unit's stations;
 * staff attached at department level (heads of a department at a terminal, for example) use their
 * department's stations; anyone also sees the stations they head and any post their roster sends
 * them to cover today. Airport-wide roles (super admin, RGM, GM) see every station.
 *
 * This only decides what the app offers. The server must enforce the same rule at check-in.
 */
export interface StationNode {
	id: string;
	name: string;
	parentDepartmentId?: string | null;
	departmentLevel?: number | null;
	headUserId?: string | null;
	archivedAt?: string | null;
}

export const SEES_ALL_STATIONS = [
	"SUPER_ADMIN",
	"ORG_ADMIN",
	"ADMIN",
	"RGM",
	"GM",
];

export interface StationScope<T extends StationNode = StationNode> {
	/** Stations of the person's own unit (or department), plus any they head. */
	mine: T[];
	/** Other units' posts the roster sends them to cover today. */
	covering: T[];
	/** True when the person sees every station because of their role. */
	all: boolean;
}

const norm = (s: string) => s.trim().toLowerCase();

export function stationsFor<T extends StationNode>(
	person: {
		id?: string | null;
		departmentId?: string | null;
		roles?: string[];
	},
	departments: T[] | undefined,
	coverLocations: (string | null | undefined)[] = [],
): StationScope<T> {
	const live = (departments ?? []).filter((d) => !d.archivedAt);
	const byId = new Map(live.map((d) => [d.id, d]));
	const depth = (d: T) => {
		let n = 1;
		let p = d.parentDepartmentId ? byId.get(d.parentDepartmentId) : undefined;
		while (p && n < 6) {
			n++;
			p = p.parentDepartmentId ? byId.get(p.parentDepartmentId) : undefined;
		}
		return n;
	};
	const stations = live.filter((d) => (d.departmentLevel ?? depth(d)) === 3);
	if (
		(person.roles ?? []).some((r) =>
			SEES_ALL_STATIONS.includes(r.toUpperCase()),
		)
	)
		return { mine: stations, covering: [], all: true };

	const own = person.departmentId ? byId.get(person.departmentId) : undefined;
	// A station's officers share their unit's stations (for example TDT and IT2 posts of one unit).
	const scope =
		own && (own.departmentLevel ?? depth(own)) === 3
			? own.parentDepartmentId
			: own?.id;
	const within = (d: T) => {
		let p: T | undefined = d;
		while (p) {
			if (p.id === scope) return true;
			p = p.parentDepartmentId ? byId.get(p.parentDepartmentId) : undefined;
		}
		return false;
	};
	const mine = stations.filter(
		(s) => (scope && within(s)) || (person.id && s.headUserId === person.id),
	);
	const wanted = new Set(
		coverLocations.filter(Boolean).map((c) => norm(c as string)),
	);
	const covering = stations.filter(
		(s) => wanted.has(norm(s.name)) && !mine.includes(s),
	);
	return { mine, covering, all: false };
}
