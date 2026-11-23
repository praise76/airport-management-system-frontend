import { useQueries } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useGetRosters } from "@/features/roster/api";
import { RosterSectionNav } from "@/features/roster/components/RosterSectionNav";
import {
	type DayTotal,
	dailyTotals,
	type TotalsRoster,
	weekOf,
} from "@/features/roster/dailyTotals";
import { useAllDepartments } from "@/hooks/departments";
import { getRoles, ROLE_GROUPS, requireStaff } from "@/lib/access";
import { SEES_ALL_STATIONS } from "@/lib/stationAccess";
import { useAuthStore } from "@/stores/auth";

export const Route = createFileRoute("/roster/daily-totals")({
	beforeLoad: requireStaff([...ROLE_GROUPS.supervisors, "GM"]),
	component: DailyTotalsPage,
});

const lagosToday = () =>
	new Date(Date.now() + 3600_000).toISOString().slice(0, 10);
const shiftOrder = ["morning", "day", "afternoon", "night", "other"];
const MIN_KEY = "nams.dailyTotals.minimums";

/** Minimums are kept on this device until the server can store one per unit. */
function useMinimums() {
	const [mins, setMins] = useState<Record<string, number>>(() => {
		try {
			return JSON.parse(localStorage.getItem(MIN_KEY) ?? "{}");
		} catch {
			return {};
		}
	});
	const set = (unit: string, v: number | undefined) => {
		const next = { ...mins };
		if (v && v > 0) next[unit] = v;
		else delete next[unit];
		setMins(next);
		try {
			localStorage.setItem(MIN_KEY, JSON.stringify(next));
		} catch {
			/* storage unavailable: keep it for this visit only */
		}
	};
	return [mins, set] as const;
}

function DailyTotalsPage() {
	const user = useAuthStore((s) => s.user);
	const [anchor, setAnchor] = useState(lagosToday());
	const days = weekOf(anchor);
	const { data: rosters } = useGetRosters();
	const { data: departments } = useAllDepartments();
	const [mins, setMin] = useMinimums();

	const details = useQueries({
		queries: (rosters ?? [])
			.filter(
				(r) =>
					r.approvalStatus !== "draft" &&
					String(r.endDate).slice(0, 10) >= days[0] &&
					String(r.startDate).slice(0, 10) <= days[6],
			)
			.map((r) => ({
				queryKey: ["roster", r.id],
				queryFn: async () => (await api.get(`/roster/${r.id}`)).data.data,
				staleTime: 60_000,
			})),
	});
	const loaded = details.map((q) => q.data).filter(Boolean) as (TotalsRoster & {
		entries?: {
			staffId: string;
			staff?: { firstName?: string; lastName?: string };
			user?: { firstName?: string; lastName?: string };
		}[];
	})[];
	const loading = details.some((q) => q.isLoading) || !rosters;

	const names = useMemo(() => {
		const m = new Map<string, string>();
		for (const r of loaded)
			for (const e of r.entries ?? [])
				if (e.staff ?? e.user)
					m.set(
						e.staffId,
						`${(e.staff ?? e.user)?.firstName ?? ""} ${(e.staff ?? e.user)?.lastName ?? ""}`.trim(),
					);
		return m;
	}, [loaded]);

	// Which units this person may see: everything for airport-wide roles, otherwise their own department.
	const scope = useMemo(() => {
		const all = departments ?? [];
		const byId = new Map(all.map((d) => [d.id, d]));
		const topOf = (id?: string | null) => {
			let d = id ? byId.get(id) : undefined;
			while (d?.parentDepartmentId) d = byId.get(d.parentDepartmentId);
			return d;
		};
		const me = user as { departmentId?: string } | null;
		const everything = getRoles(user).some((r) =>
			SEES_ALL_STATIONS.includes(r),
		);
		const myTop = topOf(me?.departmentId)?.id;
		return {
			byId,
			topOf,
			allowed: (unitId: string) => everything || topOf(unitId)?.id === myTop,
		};
	}, [departments, user]);

	const totals = useMemo(() => dailyTotals(loaded, days), [loaded, days]);
	const rows = useMemo(() => {
		const list = [...totals.keys()]
			.filter((u) => scope.allowed(u))
			.map((u) => ({
				id: u,
				unit: scope.byId.get(u)?.name ?? "Unit",
				dept: scope.topOf(u)?.name ?? "",
			}));
		return list.sort(
			(a, b) => a.dept.localeCompare(b.dept) || a.unit.localeCompare(b.unit),
		);
	}, [totals, scope]);

	const shiftWeek = (n: number) =>
		setAnchor(
			new Date(new Date(`${days[0]}T12:00:00Z`).getTime() + n * 7 * 864e5)
				.toISOString()
				.slice(0, 10),
		);
	const label = (d: string) =>
		new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", {
			weekday: "short",
			day: "numeric",
			month: "short",
			timeZone: "UTC",
		});

	return (
		<div className="space-y-6">
			<RosterSectionNav />
			<div className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">Daily totals</h1>
					<p className="text-sm text-muted-foreground">
						How many people each unit has on duty each day: rotating teams and
						Monday-to-Friday staff together, from published rosters. People on
						leave are not counted. Click a number to see who.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="icon"
						aria-label="Previous week"
						onClick={() => shiftWeek(-1)}
					>
						<ChevronLeft className="h-4 w-4" />
					</Button>
					<span className="text-sm font-medium min-w-48 text-center">
						{label(days[0])} to {label(days[6])}
					</span>
					<Button
						variant="outline"
						size="icon"
						aria-label="Next week"
						onClick={() => shiftWeek(1)}
					>
						<ChevronRight className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{loading ? (
				<p className="text-muted-foreground">Adding up the rosters…</p>
			) : rows.length === 0 ? (
				<p className="text-muted-foreground border-2 border-dashed rounded-xl p-8 text-center">
					No published roster covers this week.
				</p>
			) : (
				<div className="overflow-x-auto rounded-xl border">
					<table className="w-full text-sm">
						<thead className="bg-muted/40">
							<tr>
								<th className="p-3 text-left font-medium">Unit</th>
								<th className="p-3 text-left font-medium w-24">Minimum</th>
								{days.map((d) => (
									<th
										key={d}
										className={`p-3 text-center font-medium ${d === lagosToday() ? "text-primary" : ""}`}
									>
										{label(d)}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{rows.map((r, i) => (
								<Fragment key={r.id}>
									{(i === 0 || rows[i - 1].dept !== r.dept) && (
										<tr key={`${r.dept}-h`} className="bg-muted/20">
											<td
												colSpan={days.length + 2}
												className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
											>
												{r.dept}
											</td>
										</tr>
									)}
									<tr className="border-t">
										<td className="p-3 font-medium">{r.unit}</td>
										<td className="p-3">
											<Input
												type="number"
												min={0}
												aria-label={`Minimum on duty for ${r.unit}`}
												className="h-8 w-16"
												value={mins[r.id] ?? ""}
												placeholder="–"
												onChange={(e) =>
													setMin(r.id, Number(e.target.value) || undefined)
												}
											/>
										</td>
										{days.map((d) => (
											<td key={d} className="p-1 text-center">
												<DayCell
													total={totals.get(r.id)?.get(d)}
													min={mins[r.id]}
													nameOf={(id) => names.get(id) ?? "Staff member"}
												/>
											</td>
										))}
									</tr>
								</Fragment>
							))}
						</tbody>
					</table>
				</div>
			)}
			<p className="text-xs text-muted-foreground">
				Minimums are saved on this device for now. Days below a unit's minimum
				are marked in red.
			</p>
		</div>
	);
}

function DayCell({
	total,
	min,
	nameOf,
}: {
	total?: DayTotal;
	min?: number;
	nameOf: (id: string) => string;
}) {
	const n = total?.onDuty ?? 0;
	const short = !!min && n < min;
	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={`w-full rounded-md px-2 py-2 font-semibold hover:bg-muted ${short ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : ""}`}
					aria-label={`${n} on duty${short ? `, below the minimum of ${min}` : ""}`}
				>
					<span className="inline-flex items-center gap-1">
						{short && <TriangleAlert className="h-3.5 w-3.5" />}
						{n}
					</span>
					{!!total?.onLeave && (
						<span className="block text-[11px] font-normal text-muted-foreground">
							{total.onLeave} on leave
						</span>
					)}
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-72 text-sm">
				{n === 0 ? (
					<p className="text-muted-foreground">Nobody rostered.</p>
				) : (
					<div className="space-y-2">
						{Object.entries(total?.byShift ?? {})
							.sort(([a], [b]) => shiftOrder.indexOf(a) - shiftOrder.indexOf(b))
							.map(([shift, ids]) => (
								<div key={shift}>
									<p className="font-medium capitalize">
										{shift} ({ids.length})
									</p>
									<p className="text-muted-foreground">
										{ids.map(nameOf).join(", ")}
									</p>
								</div>
							))}
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
