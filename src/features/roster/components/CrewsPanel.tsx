import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarCheck, MessageSquare, Plus, Trash2, Users } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { addGroupMember as addChatMember } from "@/api/messaging";
import { DepartmentSelector } from "@/components/departments/DepartmentSelector";
import { ColleaguePicker } from "@/components/staff/ColleaguePicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetShiftPatterns } from "@/features/roster/api";
import {
	type Crew,
	addCrewMember,
	addDays,
	applyCrewPattern,
	createCrew,
	createCrewChat,
	crewShiftOn,
	crewsByShift,
	listCrewMembers,
	listCrews,
	removeCrewMember,
	todayLocal,
} from "@/features/roster/crews";
import { PATTERN_SHIFT_OPTIONS, crewLabel, planCrews } from "@/features/roster/patternPresets";
import type { ShiftPattern } from "@/features/roster/types";

const shiftLabel = (code?: string | null) =>
	code ? (PATTERN_SHIFT_OPTIONS.find((o) => o.value === code)?.label ?? code) : "Not started";

/** Crews for one department: members, pattern, chat, and who is on which shift today. */
export function CrewsPanel() {
	const [departmentId, setDepartmentId] = useState<string>("");
	const { data: patterns = [], isError: patternsFailed } = useGetShiftPatterns();
	const crewsQ = useQuery({
		queryKey: ["crews", departmentId],
		queryFn: () => listCrews(departmentId),
		enabled: !!departmentId,
	});
	const crews = crewsQ.data ?? [];
	const today = todayLocal();

	return (
		<section className="space-y-4" aria-labelledby="crews-heading">
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h2 id="crews-heading" className="text-xl font-semibold tracking-tight">
						Crews
					</h2>
					<p className="text-sm text-muted-foreground">
						Put people into crews, give each crew a pattern and start date, and message a crew or
						today's shift.
					</p>
				</div>
				<div className="w-full max-w-xs">
					<DepartmentSelector
						value={departmentId}
						onChange={(v) => setDepartmentId(v ?? "")}
						placeholder="Choose a department or unit"
						maxLevel={2}
					/>
				</div>
			</div>

			{patternsFailed && (
				<p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
					Saved patterns couldn't be loaded, so crews can't be created or shown on a shift yet.
				</p>
			)}
			{!departmentId ? (
				<p className="rounded-lg border bg-muted/20 p-6 text-sm text-muted-foreground">
					Choose a department to see and set up its crews.
				</p>
			) : crewsQ.isLoading ? (
				<p className="text-sm text-muted-foreground">Loading crews…</p>
			) : crewsQ.isError ? (
				<p role="alert" className="text-sm text-destructive">
					Couldn't load crews. Please refresh the page.
				</p>
			) : (
				<>
					<OnDutyToday crews={crews} patterns={patterns} date={today} />
					<div className="grid gap-4 lg:grid-cols-2">
						{crews.map((c) => (
							<CrewCard key={c.id} crew={c} patterns={patterns} departmentId={departmentId} today={today} />
						))}
						<NewCrewCard departmentId={departmentId} crews={crews} patterns={patterns} />
					</div>
				</>
			)}
		</section>
	);
}

/** Shift-based groups for today: which crews are on each shift. */
function OnDutyToday({ crews, patterns, date }: { crews: Crew[]; patterns: ShiftPattern[]; date: string }) {
	const groups = crewsByShift(crews, patterns, date);
	const order = ["morning", "day", "afternoon", "night", "off"];
	const codes = Object.keys(groups).sort((a, b) => order.indexOf(a) - order.indexOf(b));
	if (crews.length === 0) return null;
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="flex items-center gap-2 text-base">
					<CalendarCheck className="h-4 w-4" /> On duty today ({date})
				</CardTitle>
				<CardDescription>Each shift's crews. Message a crew to reach everyone on that shift.</CardDescription>
			</CardHeader>
			<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{codes.map((code) => (
					<div key={code} className="rounded-md border p-3">
						<p className="text-sm font-medium">{shiftLabel(code)}</p>
						<ul className="mt-2 space-y-1">
							{groups[code].map((c) => (
								<li key={c.id} className="flex items-center justify-between gap-2 text-sm">
									<span>{c.name}</span>
									{c.meta.conversationId && code !== "off" && (
										<Link
											to="/messages/$conversationId"
											params={{ conversationId: c.meta.conversationId }}
											className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
										>
											<MessageSquare className="h-3 w-3" /> Message
										</Link>
									)}
								</li>
							))}
						</ul>
					</div>
				))}
			</CardContent>
		</Card>
	);
}

function CrewCard({
	crew,
	patterns,
	departmentId,
	today,
}: {
	crew: Crew;
	patterns: ShiftPattern[];
	departmentId: string;
	today: string;
}) {
	const qc = useQueryClient();
	const pickerId = useId();
	const pattern = patterns.find((p) => p.id === crew.meta.patternId);
	const membersQ = useQuery({ queryKey: ["crews", crew.id, "members"], queryFn: () => listCrewMembers(crew.id) });
	const members = membersQ.data ?? [];
	const refresh = () => {
		qc.invalidateQueries({ queryKey: ["crews", crew.id, "members"] });
		qc.invalidateQueries({ queryKey: ["crews", departmentId] });
	};

	const add = useMutation({
		mutationFn: async (userId: string) => {
			await addCrewMember(crew.id, userId);
			// Keep the crew chat in step with the crew.
			if (crew.meta.conversationId) await addChatMember(crew.meta.conversationId, userId).catch(() => undefined);
		},
		onSuccess: () => {
			toast.success("Added to crew");
			refresh();
		},
		onError: (e: any) => toast.error(e?.message || "Couldn't add to crew"),
	});
	const remove = useMutation({
		mutationFn: (userId: string) => removeCrewMember(crew.id, userId),
		onSuccess: () => {
			toast.success("Removed from crew");
			refresh();
		},
		onError: (e: any) => toast.error(e?.message || "Couldn't remove from crew"),
	});
	const apply = useMutation({
		mutationFn: () => applyCrewPattern(crew, members),
		onSuccess: ({ assigned, failed }) => {
			if (failed.length)
				toast.error(
					`Pattern applied to ${assigned} of ${members.length}. Failed: ${failed.map((m) => `${m.user?.firstName} ${m.user?.lastName}`).join(", ")}`,
				);
			else toast.success(`Pattern applied to all ${assigned} members from ${crew.meta.startDate}`);
			qc.invalidateQueries({ queryKey: ["rosters"] });
		},
		onError: (e: any) => toast.error(e?.message || "Couldn't apply the pattern"),
	});
	const chat = useMutation({
		mutationFn: () => createCrewChat(crew, members),
		onSuccess: () => {
			toast.success("Crew chat created");
			qc.invalidateQueries({ queryKey: ["crews", departmentId] });
		},
		onError: (e: any) => toast.error(e?.message || "Couldn't create the crew chat"),
	});

	const memberIds = members.map((m) => m.userId);

	return (
		<Card>
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-2">
					<div>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Users className="h-4 w-4" /> {crew.name}
						</CardTitle>
						<CardDescription>
							{pattern ? pattern.patternName : "Pattern not found"} · day 1 on {crew.meta.startDate}
						</CardDescription>
					</div>
					<Badge variant="secondary">
						Today: {pattern ? shiftLabel(crewShiftOn(pattern, crew.meta.startDate, today)) : "–"}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor={pickerId}>Add a person</Label>
					<ColleaguePicker
						id={pickerId}
						departmentId={departmentId}
						excludeIds={memberIds}
						placeholder="Search staff in this department"
						onChange={(id) => id && add.mutate(id)}
						disabled={add.isPending}
					/>
				</div>

				{membersQ.isLoading ? (
					<p className="text-sm text-muted-foreground">Loading members…</p>
				) : members.length === 0 ? (
					<p className="text-sm text-muted-foreground">No one in this crew yet.</p>
				) : (
					<ul className="divide-y rounded-md border">
						{members.map((m) => (
							<li key={m.userId} className="flex items-center justify-between px-3 py-2 text-sm">
								<span>
									{m.user?.firstName} {m.user?.lastName}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => remove.mutate(m.userId)}
									disabled={remove.isPending}
									aria-label={`Remove ${m.user?.firstName ?? "member"} from ${crew.name}`}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</li>
						))}
					</ul>
				)}

				<div className="flex flex-wrap gap-2">
					<Button
						type="button"
						onClick={() => apply.mutate()}
						disabled={!members.length || !pattern || apply.isPending}
					>
						{apply.isPending ? "Applying…" : "Apply pattern to roster"}
					</Button>
					{crew.meta.conversationId ? (
						<Button asChild variant="outline">
							<Link to="/messages/$conversationId" params={{ conversationId: crew.meta.conversationId }}>
								<MessageSquare className="mr-2 h-4 w-4" /> Open crew chat
							</Link>
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							onClick={() => chat.mutate()}
							disabled={!members.length || chat.isPending}
						>
							<MessageSquare className="mr-2 h-4 w-4" /> Create crew chat
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

/** Create the next crew, suggesting its start date from the pattern's crew plan. */
function NewCrewCard({
	departmentId,
	crews,
	patterns,
}: {
	departmentId: string;
	crews: Crew[];
	patterns: ShiftPattern[];
}) {
	const qc = useQueryClient();
	const ids = { name: useId(), pattern: useId(), start: useId() };
	const [patternId, setPatternId] = useState("");
	const pattern = patterns.find((p) => p.id === patternId);
	const onPattern = crews.filter((c) => c.meta.patternId === patternId);
	const plan = pattern ? planCrews(pattern) : null;

	// Next crew letter and start date: first crew's start + the plan's next offset.
	const suggestion = useMemo(() => {
		const index = onPattern.length;
		const name = `Crew ${crewLabel(index)}`;
		const base = onPattern[0]?.meta.startDate ?? todayLocal();
		const offset = plan?.offsets[index] ?? 0;
		return { name, start: index === 0 ? base : addDays(base, offset) };
	}, [onPattern, plan]);

	const [name, setName] = useState("");
	const [start, setStart] = useState("");

	const create = useMutation({
		mutationFn: () =>
			createCrew({
				name: name || suggestion.name,
				departmentId,
				patternId,
				startDate: start || suggestion.start,
				patternName: pattern?.patternName,
			}),
		onSuccess: () => {
			toast.success("Crew created");
			setName("");
			setStart("");
			qc.invalidateQueries({ queryKey: ["crews", departmentId] });
		},
		onError: (e: any) => toast.error(e?.message || "Couldn't create the crew"),
	});

	const full = plan && onPattern.length >= plan.crews;

	return (
		<Card className="border-dashed">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-lg">
					<Plus className="h-4 w-4" /> New crew
				</CardTitle>
				<CardDescription>
					{plan
						? `This pattern needs ${plan.crews} crews for 24-hour cover; ${onPattern.length} set up so far.`
						: "Choose a pattern to get a suggested name and start date."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="space-y-1">
					<Label htmlFor={ids.pattern}>Pattern</Label>
					<Select value={patternId} onValueChange={setPatternId}>
						<SelectTrigger id={ids.pattern}>
							<SelectValue placeholder={patterns.length ? "Choose a pattern" : "Create a pattern first"} />
						</SelectTrigger>
						<SelectContent>
							{patterns.map((p) => (
								<SelectItem key={p.id} value={p.id}>
									{p.patternName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
						<Label htmlFor={ids.name}>Crew name</Label>
						<Input id={ids.name} value={name} onChange={(e) => setName(e.target.value)} placeholder={suggestion.name} />
					</div>
					<div className="space-y-1">
						<Label htmlFor={ids.start}>Day 1 of the pattern</Label>
						<Input id={ids.start} type="date" value={start || suggestion.start} onChange={(e) => setStart(e.target.value)} />
					</div>
				</div>
				{full && (
					<p className="text-xs text-muted-foreground">
						All {plan?.crews} crews exist for this pattern. Another crew would double up a shift.
					</p>
				)}
				<Button type="button" onClick={() => create.mutate()} disabled={!patternId || create.isPending}>
					{create.isPending ? "Creating…" : "Create crew"}
				</Button>
			</CardContent>
		</Card>
	);
}
