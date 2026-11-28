/**
 * Daily totals: how many people each unit has on duty on each day, from every published roster
 * (rotating teams and Monday-to-Friday permanent staff alike). People on leave are left out and
 * counted separately. One person counts once a day, however many shifts they hold.
 */
export interface TotalsEntry {
	staffId: string;
	dutyDate: string;
	shift?: string | null;
	status?: string | null;
	unitDepartmentId?: string | null;
}
export interface TotalsRoster {
	unitDepartmentId?: string | null;
	approvalStatus?: string | null;
	entries?: TotalsEntry[];
}
export interface DayTotal {
	onDuty: number;
	onLeave: number;
	/** shift name → staff ids on duty */
	byShift: Record<string, string[]>;
}

const day = (d: string) => String(d).slice(0, 10);
const onLeave = (e: TotalsEntry) => /leave/i.test(e.status ?? "");

export function dailyTotals(
	rosters: TotalsRoster[],
	days: string[],
): Map<string, Map<string, DayTotal>> {
	const wanted = new Set(days);
	const out = new Map<string, Map<string, DayTotal>>();
	const seen = new Set<string>();
	for (const r of rosters) {
		if (!["approved", "active"].includes(r.approvalStatus ?? "")) continue;
		for (const e of r.entries ?? []) {
			const d = day(e.dutyDate);
			const unit = e.unitDepartmentId ?? r.unitDepartmentId;
			if (!wanted.has(d) || !unit) continue;
			const key = `${unit}|${d}|${e.staffId}`;
			const perUnit =
				out.get(unit) ??
				new Map(days.map((x) => [x, { onDuty: 0, onLeave: 0, byShift: {} }]));
			out.set(unit, perUnit);
			const t = perUnit.get(d) as DayTotal;
			if (onLeave(e)) {
				if (!seen.has(`${key}|leave`)) t.onLeave++;
				seen.add(`${key}|leave`);
				continue;
			}
			const shift = e.shift ?? "other";
			t.byShift[shift] = [...(t.byShift[shift] ?? []), e.staffId];
			if (!seen.has(key)) t.onDuty++;
			seen.add(key);
		}
	}
	return out;
}

/** The seven dates (Monday to Sunday) of the week that contains `date`. */
export function weekOf(date: string): string[] {
	const d = new Date(`${date}T12:00:00Z`);
	const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5);
	return Array.from({ length: 7 }, (_, i) =>
		new Date(monday.getTime() + i * 864e5).toISOString().slice(0, 10),
	);
}
