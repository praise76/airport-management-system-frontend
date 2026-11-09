import { useQueries, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { useZoneLabel } from "@/hooks/geofence";
import { cn } from "@/lib/utils";

/**
 * Self-service "Roster" tab: the person's own shifts plus their team's PUBLISHED roster.
 *
 * Before (QA, 9 Nov): the tab only listed the person's own entries, with raw dates
 * ("2026-11-09"), "morning Shift" and "06:00:00 - 14:00:00", so it looked like a broken copy
 * of My schedule. Staff expect to see who they're on duty with.
 *
 * Data: GET /roster?unitDepartmentId= (rosters for the person's unit) and GET /roster/:id
 * (entries with the person on each). Only approved rosters are shown, and only names are
 * rendered. NOTE: the API currently returns each person's full record, including the password
 * hash; that must be removed in the backend (see docs/QA_BACKEND_FIXES_2026-11-08.md).
 */

type Entry = {
	id: string;
	staffId: string;
	dutyDate: string;
	shift: string;
	shiftStartTime?: string;
	shiftEndTime?: string;
	dutyPosition?: string;
	dutyLocation?: string;
	status?: string;
	staff?: { id: string; firstName?: string; lastName?: string };
	terminal?: { terminalName?: string; terminalCode?: string } | null;
};
type RosterSummary = { id: string; rosterName: string; startDate: string; endDate: string; approvalStatus: string; unitDepartmentId?: string; departmentId?: string };

const SHIFT_STYLE: Record<string, string> = {
	morning: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
	day: "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
	afternoon: "bg-orange-100 text-orange-900 dark:bg-orange-500/20 dark:text-orange-200",
	night: "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/25 dark:text-indigo-200",
};
const SHIFT_SHORT: Record<string, string> = { morning: "M", day: "D", afternoon: "A", night: "N" };
const PUBLISHED = new Set(["approved", "published"]);

const hm = (t?: string) => (t ? t.slice(0, 5) : "");
const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Monday of the week containing d. */
const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
const dayLabel = (iso: string, opts: Intl.DateTimeFormatOptions) =>
	new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(undefined, opts);
const nameOf = (e: Entry) => [e.staff?.firstName, e.staff?.lastName].filter(Boolean).join(" ") || "Colleague";

export function TeamRoster({ myUserId, departmentId, myEntries }: { myUserId?: string; departmentId?: string | null; myEntries: Entry[] }) {
	const zoneLabel = useZoneLabel();
	const [anchor, setAnchor] = useState(() => weekStart(new Date()));
	const days = useMemo(() => Array.from({ length: 7 }, (_, i) => ymd(addDays(anchor, i))), [anchor]);
	const today = ymd(new Date());

	const rostersQ = useQuery({
		queryKey: ["team-rosters", departmentId],
		enabled: !!departmentId,
		queryFn: async () => {
			const { data } = await api.get<{ data: RosterSummary[] }>(`/roster?unitDepartmentId=${departmentId}`);
			// The API may ignore the filter; keep only this unit's published rosters.
			return (data.data ?? []).filter(
				(r) => PUBLISHED.has(String(r.approvalStatus)) && (r.unitDepartmentId === departmentId || r.departmentId === departmentId),
			);
		},
	});
	const inWeek = (rostersQ.data ?? []).filter((r) => r.startDate.slice(0, 10) <= days[6] && r.endDate.slice(0, 10) >= days[0]);
	const entriesQ = useQueries({
		queries: inWeek.map((r) => ({
			queryKey: ["team-roster", r.id],
			queryFn: async () => (await api.get<{ data: { entries?: Entry[] } }>(`/roster/${r.id}`)).data.data?.entries ?? [],
		})),
	});
	const loading = rostersQ.isLoading || entriesQ.some((q) => q.isLoading);
	const entries: Entry[] = entriesQ.flatMap((q) => q.data ?? []).filter((e) => days.includes(String(e.dutyDate).slice(0, 10)));

	// Rows grouped by crew/position, then name; my row first in my group.
	const people = useMemo(() => {
		const map = new Map<string, { id: string; name: string; group: string; byDay: Record<string, Entry> }>();
		for (const e of entries) {
			const p = map.get(e.staffId) ?? { id: e.staffId, name: nameOf(e), group: e.dutyPosition || "Team", byDay: {} };
			p.byDay[String(e.dutyDate).slice(0, 10)] = e;
			map.set(e.staffId, p);
		}
		return [...map.values()].sort((a, b) => a.group.localeCompare(b.group) || (a.id === myUserId ? -1 : b.id === myUserId ? 1 : a.name.localeCompare(b.name)));
	}, [entries, myUserId]);

	const onDutyToday = useMemo(() => {
		const g: Record<string, string[]> = {};
		for (const e of entries) if (String(e.dutyDate).startsWith(today)) (g[e.shift] ??= []).push(nameOf(e));
		return g;
	}, [entries, today]);

	const upcoming = [...myEntries].filter((e) => String(e.dutyDate).slice(0, 10) >= today).sort((a, b) => String(a.dutyDate).localeCompare(String(b.dutyDate)));

	return (
		<div className="space-y-8">
			<section className="space-y-3" aria-labelledby="my-shifts">
				<h3 id="my-shifts" className="text-lg font-semibold">My upcoming shifts</h3>
				{upcoming.length === 0 ? (
					<p className="text-sm text-muted-foreground">You have no upcoming shifts on a published roster.</p>
				) : (
					<ul className="divide-y rounded-lg border">
						{upcoming.slice(0, 10).map((e) => (
							<li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
								<span className="font-medium">{dayLabel(e.dutyDate, { weekday: "short", day: "numeric", month: "short" })}</span>
								<span className={cn("rounded px-2 py-0.5 text-xs font-medium", SHIFT_STYLE[e.shift] ?? "bg-muted")}>
									{cap(e.shift)} · {hm(e.shiftStartTime)}–{hm(e.shiftEndTime)}
								</span>
								<span className="text-muted-foreground">
									{[e.dutyPosition, zoneLabel(e.dutyLocation) ?? e.terminal?.terminalName].filter(Boolean).join(" · ")}
								</span>
							</li>
						))}
					</ul>
				)}
			</section>

			<section className="space-y-3" aria-labelledby="team-roster">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<h3 id="team-roster" className="flex items-center gap-2 text-lg font-semibold">
						<Users className="h-5 w-5" /> My team's roster
					</h3>
					<div className="flex items-center gap-2">
						<Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setAnchor((a) => addDays(a, -7))}>
							<ChevronLeft className="h-4 w-4" />
						</Button>
						<span className="min-w-40 text-center text-sm">
							{dayLabel(days[0], { day: "numeric", month: "short" })} – {dayLabel(days[6], { day: "numeric", month: "short", year: "numeric" })}
						</span>
						<Button variant="outline" size="icon" aria-label="Next week" onClick={() => setAnchor((a) => addDays(a, 7))}>
							<ChevronRight className="h-4 w-4" />
						</Button>
					</div>
				</div>
				{inWeek.length > 0 && <p className="text-xs text-muted-foreground">Published roster: {inWeek.map((r) => r.rosterName).join(", ")}</p>}

				{!departmentId ? (
					<p className="text-sm text-muted-foreground">Your profile has no department or unit, so there's no team roster to show.</p>
				) : loading ? (
					<p className="text-sm text-muted-foreground">Loading your team's roster…</p>
				) : rostersQ.isError || entriesQ.some((q) => q.isError) ? (
					<p role="alert" className="text-sm text-destructive">Couldn't load your team's roster. Please try again.</p>
				) : people.length === 0 ? (
					<p className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">No published roster for your team this week.</p>
				) : (
					<>
						{days.includes(today) && Object.keys(onDutyToday).length > 0 && (
							<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
								{["morning", "day", "afternoon", "night"].filter((s) => onDutyToday[s]).map((s) => (
									<div key={s} className="rounded-md border p-3 text-sm">
										<p className="font-medium">On {s} today</p>
										<p className="text-muted-foreground">{onDutyToday[s].join(", ")}</p>
									</div>
								))}
							</div>
						)}
						<div className="overflow-x-auto rounded-lg border">
							<table className="w-full min-w-[640px] text-sm">
								<thead>
									<tr className="bg-muted/40 text-left">
										<th className="px-3 py-2 font-medium">Name</th>
										{days.map((d) => (
											<th key={d} className={cn("px-2 py-2 text-center font-medium", d === today && "text-primary")}>
												{dayLabel(d, { weekday: "short" })}
												<br />
												<span className="text-xs font-normal text-muted-foreground">{dayLabel(d, { day: "numeric", month: "short" })}</span>
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{people.map((p, i) => (
										<Fragment key={p.id}>
											{(i === 0 || people[i - 1].group !== p.group) && (
												<tr className="bg-muted/20">
													<td colSpan={8} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.group}</td>
												</tr>
											)}
											<tr className={cn("border-t", p.id === myUserId && "bg-primary/5 font-medium")}>
												<td className="px-3 py-2">{p.name}{p.id === myUserId && <span className="ml-1 text-xs text-primary">(you)</span>}</td>
												{days.map((d) => {
													const e = p.byDay[d];
													return (
														<td key={d} className="px-1 py-1.5 text-center">
															{e ? (
																<span
																	title={`${cap(e.shift)} ${hm(e.shiftStartTime)}–${hm(e.shiftEndTime)}`}
																	className={cn("inline-block min-w-8 rounded px-1.5 py-0.5 text-xs font-semibold", SHIFT_STYLE[e.shift] ?? "bg-muted")}
																>
																	{SHIFT_SHORT[e.shift] ?? cap(e.shift)}
																</span>
															) : (
																<span className="text-xs text-muted-foreground">Off</span>
															)}
														</td>
													);
												})}
											</tr>
										</Fragment>
									))}
								</tbody>
							</table>
						</div>
						<p className="text-xs text-muted-foreground">M = Morning · A = Afternoon · D = Day (12 h) · N = Night. Hover a shift for its hours.</p>
					</>
				)}
			</section>
		</div>
	);
}
