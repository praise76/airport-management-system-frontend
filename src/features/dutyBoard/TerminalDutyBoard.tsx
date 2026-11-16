import { useQueries, useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "@/api/client";
import { useDepartments } from "@/hooks/departments";
import { useTerminals } from "@/hooks/terminals";
import { type BoardPlace, boardScope, todaysTerminal } from "@/lib/boardScope";
import { ReportIssue } from "./ReportIssue";
import { useAuthStore } from "@/stores/auth";
import type { DutyBoardResponse, DutyDepartment } from "@/types/dutyBoard";
import { UnitCard } from "./UnitCard";

const OTHER = "OTHER";
type Group = { code: string; name: string; departments: DutyDepartment[] };

const fetchBoard = async (terminalId?: string): Promise<DutyBoardResponse> => {
	const res = await api.get("/public/duty-board", {
		params: { departmentId: "all", terminalId },
	});
	return (res.data?.data ?? res.data) as DutyBoardResponse;
};
const list = (x: unknown) =>
	(Array.isArray(x)
		? x
		: ((x as { items?: unknown[]; data?: unknown[] })?.items ??
			(x as { data?: unknown[] })?.data ??
			[])) as any[];

/** The open clock-in from today's events: the last event, if it is a clock-in, and its terminal code. */
export function openSession(
	logs: { eventType?: string; createdAt?: string; zoneName?: string }[],
) {
	const last = [...logs]
		.sort((x, y) => String(x.createdAt).localeCompare(String(y.createdAt)))
		.at(-1);
	if (!last || !/in$/i.test(last.eventType ?? "")) return [];
	const code = /\(([A-Z0-9-]+)\)\s*$/.exec(last.zoneName ?? "")?.[1];
	return code
		? [{ terminalCode: code, startedAt: last.createdAt, endedAt: null }]
		: [];
}

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

/** The Airport Duty Officers rostered at a terminal now: those on post first, else everyone rostered. */
export function adoOnDuty(departments: DutyDepartment[]) {
	const staff = departments
		.flatMap((d) => d.units)
		.filter((u) => /ADO Office/i.test(u.name))
		.flatMap((u) => u.onDutyStaff ?? []);
	const onPost = staff.filter((s) => s.checkedIn);
	return (onPost.length ? onPost : staff).map((s) => s.id);
}

/** Counts for one group: rostered, on post, late, not arrived, posts short of staff. */
export function tally(departments: DutyDepartment[]) {
	const staff = departments.flatMap((d) =>
		d.units.flatMap((u) => u.onDutyStaff ?? []),
	);
	return {
		rostered: staff.length,
		onPost: staff.filter((s) => s.checkedIn).length,
		late: staff.filter((s) => s.checkedIn && s.isLate).length,
		notArrived: staff.filter((s) => !s.checkedIn).length,
		short: departments
			.flatMap((d) => d.units)
			.filter((u) => u.coverageStatus !== "adequate").length,
	};
}

/**
 * Split the board by terminal. People whose shift has no terminal (patrol beats, control room,
 * roaming teams such as Wildlife and Bird Control) go under "Around the airport".
 */
export function byTerminal(
	all: DutyBoardResponse | undefined,
	perTerminal: { code: string; name: string; board?: DutyBoardResponse }[],
): Group[] {
	const seen = new Set<string>();
	const groups: Group[] = perTerminal.map((t) => {
		const departments = (t.board?.departments ?? []).filter((d) =>
			d.units.some((u) => (u.onDutyStaff ?? []).length),
		);
		for (const d of departments)
			for (const u of d.units)
				for (const s of u.onDutyStaff ?? []) seen.add(`${u.id}:${s.id}`);
		return { code: t.code, name: t.name, departments };
	});
	const rest = (all?.departments ?? [])
		.map((d) => ({
			...d,
			units: d.units
				.map((u) => ({
					...u,
					onDutyStaff: (u.onDutyStaff ?? []).filter(
						(s) => !seen.has(`${u.id}:${s.id}`),
					),
				}))
				.filter((u) => u.onDutyStaff.length),
		}))
		.filter((d) => d.units.length);
	groups.push({
		code: OTHER,
		name: "Around the airport",
		departments: rest,
	});
	return groups;
}

/** Keep only the departments and units in `ids` (a HOD's department, a Head of Unit's unit). */
export function onlyDepartments(groups: Group[], ids: string[]): Group[] {
	return groups.map((g) => ({
		...g,
		departments: g.departments
			.map((d) =>
				ids.includes(d.id)
					? d
					: { ...d, units: d.units.filter((u) => ids.includes(u.id)) },
			)
			.filter((d) => d.units.length),
	}));
}

function Departments({
	departments,
	canPing,
	hideCoverageFor,
}: {
	departments: DutyDepartment[];
	canPing: boolean;
	hideCoverageFor?: (d: DutyDepartment) => boolean;
}) {
	if (!departments.length)
		return (
			<p className="text-sm text-slate-500">
				Nobody is rostered here for the current shift.
			</p>
		);
	return (
		<div className="space-y-6">
			{departments.map((d) => (
				<div key={d.id} className="space-y-3">
					<h3 className="text-base font-semibold text-blue-100">
						{d.name}{" "}
						<span className="ml-1 text-xs font-normal text-slate-400">
							{d.currentShift} shift
						</span>
					</h3>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{d.units.map((u) => (
							<UnitCard
								key={u.id}
								unit={u}
								canPing={canPing}
								hideCoverage={hideCoverageFor?.(d)}
							/>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

/** The signed-in duty board: by terminal, limited to what the viewer's role may see. */
export function TerminalDutyBoard({ canPing }: { canPing: boolean }) {
	const user = useAuthStore((s) => s.user) as any;
	const { data: deptData } = useDepartments({ limit: 500 } as any);
	const departments = list((deptData as any)?.data ?? deptData);
	const { data: terminals = [] } = useTerminals();
	// Where the person clocked in today, from today's clock-in and clock-out events.
	const sessions = useQuery({
		queryKey: ["board", "my-today"],
		queryFn: async () =>
			openSession(
				list((await api.get("/attendance/me/today")).data?.data?.logs),
			),
	});
	// Their shifts yesterday and today (a night shift from yesterday may still be running).
	const shifts = useQuery({
		queryKey: ["board", "my-shifts"],
		queryFn: async () => {
			const d = (n: number) =>
				new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
			return list(
				(
					await api.get("/self-service/roster", {
						params: { startDate: d(1), endDate: d(0) },
					})
				).data?.data,
			);
		},
	});
	const all = useQuery({
		queryKey: ["board", "all"],
		queryFn: () => fetchBoard(),
		refetchInterval: 60_000,
	});
	const boards = useQueries({
		queries: terminals.map((t) => ({
			queryKey: ["board", t.id],
			queryFn: () => fetchBoard(t.id),
			refetchInterval: 60_000,
		})),
	});
	const [open, setOpen] = useState<string | null>(null);

	const mine = todaysTerminal(
		sessions.data ?? [],
		shifts.data ?? [],
		terminals as any,
	);
	const place = placeOf(departments, user?.departmentId, terminals.length);
	const scopeCode = place.runsTerminal ?? mine;
	const scope = boardScope(
		user,
		departments,
		mine,
		terminals.find((t) => t.terminalCode === scopeCode)?.terminalName,
		place,
	);
	// The Airport Duty Officer on duty at a terminal, to alert on urgent reports there.
	const adoIdsAt = (code: string) =>
		adoOnDuty(groups.find((g) => g.code === code)?.departments ?? []);
	const myId = user?.userId ?? user?.id;
	const termOf = (code: string) =>
		terminals.find((t) => t.terminalCode === code);
	const groups = useMemo(
		() =>
			byTerminal(
				all.data,
				terminals.map((t, i) => ({
					code: t.terminalCode,
					name: t.terminalName,
					board: boards[i]?.data,
				})),
			),
		// biome-ignore lint/correctness/useExhaustiveDependencies: boards is a new array each render; its data is what matters
		[all.data, terminals, ...boards.map((b) => b.data)],
	);
	// Junior staff outside AVSEC don't see AVSEC coverage warnings.
	const topOf = (id?: string | null) => {
		let d = departments.find((x) => x.id === id);
		while (d?.parentDepartmentId)
			d = departments.find((x) => x.id === d.parentDepartmentId);
		return d;
	};
	const inAvsec = topOf(user?.departmentId)?.code === "AVSEC";
	const hideCoverageFor =
		((scope.kind === "terminal" && !scope.runsIt) ||
			scope.kind === "airport") &&
		!inAvsec
			? (d: DutyDepartment) => /AVSEC|Aviation Security/i.test(d.name)
			: undefined;

	if (all.isLoading || sessions.isLoading)
		return <p className="text-slate-400">Loading the duty board…</p>;
	if (scope.kind === "none")
		return (
			<p className="rounded-lg border border-slate-800 bg-slate-900/50 p-6 text-slate-300">
				{scope.label}
			</p>
		);

	const shown =
		scope.kind === "departments"
			? onlyDepartments(groups, scope.ids)
			: scope.kind === "terminal"
				? groups.filter((g) => g.code === scope.code)
				: groups;
	const label = (
		<p className="flex items-center gap-2 text-sm text-slate-400">
			<MapPin className="h-4 w-4" /> Showing: {scope.label}
		</p>
	);

	if (scope.kind === "terminal") {
		const g = shown[0] ?? {
			code: scope.code,
			name: scope.label,
			departments: [],
		};
		const t = tally(g.departments);
		return (
			<div className="space-y-6">
				{label}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="text-slate-300">
						{t.onPost} of {t.rostered} on post at {g.name}
						{t.late ? `, ${t.late} late` : ""}
						{t.notArrived ? `, ${t.notArrived} not arrived` : ""}.
					</p>
					{canPing && termOf(scope.code) && (
						<ReportIssue
							terminal={{
								id: termOf(scope.code)!.id,
								name: termOf(scope.code)!.terminalName,
							}}
							adoIds={adoIdsAt(scope.code)}
							myId={myId}
						/>
					)}
				</div>
				<Departments
					departments={g.departments}
					canPing={canPing}
					hideCoverageFor={hideCoverageFor}
				/>
			</div>
		);
	}

	const visible = shown.filter((g) => g.departments.length);
	const current = open ? visible.find((g) => g.code === open) : null;
	return (
		<div className="space-y-6">
			{label}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{visible.map((g) => {
					const t = tally(g.departments);
					return (
						<button
							key={g.code}
							type="button"
							onClick={() => setOpen(open === g.code ? null : g.code)}
							aria-pressed={open === g.code}
							className={`rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${open === g.code ? "border-blue-500 bg-blue-950/30" : "border-slate-800 bg-slate-900/60 hover:border-slate-600"}`}
						>
							<span className="block font-semibold text-slate-100">
								{g.name}
							</span>
							<span className="mt-1 block text-2xl font-bold text-white">
								{t.onPost}
								<span className="text-base font-normal text-slate-500">
									{" "}
									/ {t.rostered} on post
								</span>
							</span>
							<span className="mt-1 block text-xs text-slate-400">
								{t.late} late · {t.notArrived} not arrived
								{t.short
									? ` · ${t.short} post${t.short === 1 ? "" : "s"} short`
									: ""}
							</span>
						</button>
					);
				})}
			</div>
			{!visible.length && (
				<p className="text-slate-400">
					Nobody in your area is rostered for the current shift.
				</p>
			)}
			{current ? (
				<section className="space-y-3">
					<h2 className="text-xl font-semibold text-white">{current.name}</h2>
					{canPing && termOf(current.code) && (
						<ReportIssue
							terminal={{
								id: termOf(current.code)!.id,
								name: termOf(current.code)!.terminalName,
							}}
							adoIds={adoIdsAt(current.code)}
							myId={myId}
						/>
					)}
					<Departments
						departments={current.departments}
						canPing={canPing}
						hideCoverageFor={hideCoverageFor}
					/>
				</section>
			) : scope.kind === "departments" ? (
				visible.map((g) => (
					<section key={g.code} className="space-y-3">
						<h2 className="text-xl font-semibold text-white">{g.name}</h2>
						<Departments
							departments={g.departments}
							canPing={canPing}
							hideCoverageFor={hideCoverageFor}
						/>
					</section>
				))
			) : (
				<p className="text-sm text-slate-500">
					Choose a terminal to see who is on duty there.
				</p>
			)}
		</div>
	);
}
