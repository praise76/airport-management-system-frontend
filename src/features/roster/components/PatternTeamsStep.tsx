import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useId, useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useGetShiftDefinitions, useGetShiftPatterns } from "../api";
import {
	coverProblems,
	planShifts,
	suggestTeamStarts,
	type TeamPlan,
} from "../buildRoster";
import { listCrewMembers, listCrews } from "../crews";

export type PatternTeamsValue = {
	patternId: string;
	/** teamId -> day-1 date; a team is included when it has a date. */
	starts: Record<string, string>;
};

/**
 * Part of "Create roster": choose the shift pattern and which of the unit's teams work it,
 * and from which day. The shifts are created with the roster.
 */
export function PatternTeamsStep({
	unitId,
	from,
	to,
	value,
	onChange,
	onPlan,
}: {
	unitId: string;
	from: string;
	to: string;
	value: PatternTeamsValue;
	onChange: (v: PatternTeamsValue) => void;
	/** The planned shifts and team details, for the submit step. */
	onPlan: (plan: {
		teams: (TeamPlan & { id: string })[];
		shifts: ReturnType<typeof planShifts>;
	}) => void;
}) {
	const ids = { pattern: useId() };
	const patternsQ = useGetShiftPatterns();
	const definitionsQ = useGetShiftDefinitions({
		unitDepartmentId: unitId || undefined,
	});
	const teamsQ = useQuery({
		queryKey: ["crews", unitId],
		queryFn: () => listCrews(unitId),
		enabled: !!unitId,
	});
	// Stable references: a fresh [] on every render would re-plan forever.
	const patterns = useMemo(() => patternsQ.data ?? [], [patternsQ.data]);
	const definitions = useMemo(
		() => definitionsQ.data ?? [],
		[definitionsQ.data],
	);
	const teams = useMemo(() => teamsQ.data ?? [], [teamsQ.data]);
	const membersQ = useQueries({
		queries: teams.map((t) => ({
			queryKey: ["crews", t.id, "members"],
			queryFn: () => listCrewMembers(t.id),
		})),
	});
	const pattern = patterns.find((p) => p.id === value.patternId);
	const membersKey = membersQ.map((q) => q.dataUpdatedAt).join(",");

	// When a pattern is chosen, suggest staggered day-1 dates for the unit's teams.
	useEffect(() => {
		if (
			!pattern ||
			!from ||
			teams.length === 0 ||
			Object.keys(value.starts).length
		)
			return;
		// Keep the teams' saved day-1 dates when they already give full cover on this pattern;
		// otherwise suggest staggered ones.
		const suggested = suggestTeamStarts(pattern, from, teams.length);
		const saved = teams.every(
			(t) => t.meta.patternId === pattern.id && t.meta.startDate,
		);
		const keep =
			saved &&
			coverProblems(
				pattern,
				planShifts({
					pattern,
					teams: teams.map((t) => ({
						name: t.name,
						startDate: t.meta.startDate,
						memberIds: ["x"],
					})),
					from,
					to: to || from,
				}),
				from,
				to || from,
			).length === 0;
		const starts: Record<string, string> = {};
		teams.forEach((t, i) => {
			starts[t.id] = keep ? t.meta.startDate : suggested[i];
		});
		onChange({ ...value, starts });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pattern?.id, from, teams.length]);

	const plan = useMemo(() => {
		if (!pattern || !from || !to) return { teams: [], shifts: [] };
		const chosen = teams
			.map((t, i) => ({
				id: t.id,
				name: t.name,
				startDate: value.starts[t.id],
				memberIds: (membersQ[i]?.data ?? []).map((m) => m.userId),
			}))
			.filter((t) => t.startDate);
		return {
			teams: chosen,
			shifts: planShifts({ pattern, teams: chosen, from, to, definitions }),
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pattern, from, to, value.starts, membersKey, definitions, teams]);
	// Tell the form only when the plan actually changes.
	const sent = useRef("");
	useEffect(() => {
		const key = JSON.stringify(plan);
		if (key === sent.current) return;
		sent.current = key;
		onPlan(plan);
	}, [plan, onPlan]);

	return (
		<fieldset className="space-y-3 rounded-lg border p-3">
			<legend className="px-1 text-sm font-medium">
				Shift pattern and teams
			</legend>
			<div className="space-y-2">
				<Label htmlFor={ids.pattern}>Pattern</Label>
				<Select
					value={value.patternId || "none"}
					onValueChange={(v) =>
						onChange({ patternId: v === "none" ? "" : v, starts: {} })
					}
				>
					<SelectTrigger id={ids.pattern} className="w-full">
						<SelectValue placeholder="Choose a pattern" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="none">
							No pattern: I'll fill the roster by hand
						</SelectItem>
						{patterns.map((p) => (
							<SelectItem key={p.id} value={p.id}>
								{p.patternName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			{pattern && !unitId && (
				<p className="text-sm text-muted-foreground">
					Choose the department or unit above to see its teams.
				</p>
			)}
			{pattern && unitId && teamsQ.isLoading && (
				<p className="text-sm text-muted-foreground">Loading teams…</p>
			)}
			{pattern && unitId && !teamsQ.isLoading && teams.length === 0 && (
				<p className="text-sm text-muted-foreground">
					This unit has no teams yet. Create them under{" "}
					<Link to="/roster/patterns" className="text-primary underline">
						Patterns &amp; teams
					</Link>
					, then come back.
				</p>
			)}
			{pattern && teams.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs text-muted-foreground">
						Tick the teams that work this roster and the day each one is on day
						1 of the pattern.
					</p>
					<ul className="space-y-2">
						{teams.map((t, i) => {
							const on = !!value.starts[t.id];
							const n = membersQ[i]?.data?.length ?? 0;
							return (
								<li key={t.id} className="flex flex-wrap items-center gap-2">
									<label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
										<input
											type="checkbox"
											checked={on}
											onChange={(e) => {
												const starts = { ...value.starts };
												if (e.target.checked)
													starts[t.id] = suggestTeamStarts(
														pattern,
														from || t.meta.startDate,
														teams.length,
													)[i];
												else delete starts[t.id];
												onChange({ ...value, starts });
											}}
										/>
										<span className="truncate font-medium">{t.name}</span>
										<span className="text-muted-foreground">
											({n} {n === 1 ? "person" : "people"})
										</span>
									</label>
									<Input
										type="date"
										aria-label={`${t.name}: day 1 of the pattern`}
										className="w-40"
										disabled={!on}
										value={value.starts[t.id] ?? ""}
										onChange={(e) =>
											onChange({
												...value,
												starts: { ...value.starts, [t.id]: e.target.value },
											})
										}
									/>
								</li>
							);
						})}
					</ul>
					{(() => {
						const gaps = plan.shifts.length
							? coverProblems(pattern, plan.shifts, from, to)
							: [];
						if (!gaps.length) return null;
						const empty = gaps.filter((g) => g.teams === 0).length,
							doubled = gaps.filter((g) => g.teams > 1).length;
						return (
							<p
								role="alert"
								className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm"
							>
								{empty
									? `${empty} shift${empty === 1 ? " has" : "s have"} no team`
									: ""}
								{empty && doubled ? " and " : ""}
								{doubled
									? `${doubled} shift${doubled === 1 ? " has" : "s have"} more than one team`
									: ""}
								{`, first on ${gaps[0].date}. Stagger the teams' day-1 dates.`}
							</p>
						);
					})()}
					<p className="text-sm" aria-live="polite">
						{plan.shifts.length > 0
							? `${plan.shifts.length} shifts will be created for ${plan.teams.length} ${plan.teams.length === 1 ? "team" : "teams"}.`
							: "No shifts yet: tick at least one team with people in it."}
					</p>
				</div>
			)}
		</fieldset>
	);
}
