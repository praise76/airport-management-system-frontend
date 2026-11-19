import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PingOnDuty } from "@/features/stations/components/PingOnDuty";
import { pingTargets } from "@/lib/dutyPing";
import type { DutyUnit } from "@/types/dutyBoard";

/** One post (unit) on the duty board: who is rostered, who is on post, and a ping button. */
export function UnitCard({
	unit,
	canPing,
	hideCoverage = false,
}: {
	unit: DutyUnit;
	canPing: boolean;
	/** Junior staff outside AVSEC do not see AVSEC coverage warnings. */
	hideCoverage?: boolean;
}) {
	const targets = pingTargets(unit);
	const shown = hideCoverage ? "" : unit.coverageStatus;
	const statusColor =
		{
			adequate: "border-emerald-900/50 bg-emerald-950/10",
			awaiting: "border-slate-800 bg-slate-900/50",
			understaffed: "border-amber-900/50 bg-amber-950/10",
			critical: "border-red-900/50 bg-red-950/10 coverage-critical",
		}[shown as DutyUnit["coverageStatus"]] ||
		"border-slate-800 bg-slate-900/50";

	const statusText =
		{
			adequate: "text-emerald-400",
			awaiting: "text-slate-400",
			understaffed: "text-amber-400",
			critical: "text-red-400",
		}[shown as DutyUnit["coverageStatus"]] || "text-slate-400";

	return (
		<Card className={`border ${statusColor} transition-colors`}>
			<CardHeader className="pb-2">
				<div className="flex flex-wrap justify-between items-start gap-2">
					<div className="min-w-0">
						<CardTitle className="text-base text-slate-100">
							{unit.name}
						</CardTitle>
						<p className="text-xs text-slate-500">{unit.location}</p>
					</div>
					{shown && (
						<Badge
							variant="outline"
							className={`shrink-0 bg-slate-950 uppercase text-[10px] tracking-wider ${statusText} border-opacity-20`}
						>
							{shown === "awaiting" ? "Awaiting clock-in" : shown}
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="grid grid-cols-2 gap-2">
						{[...(unit.onDutyStaff ?? [])]
							// People at their post first, then late, then not yet arrived.
							.sort((a, b) => Number(b.checkedIn) - Number(a.checkedIn))
							.map((staff) => (
								<div
									key={staff.id}
									className={`flex items-center gap-2 p-1.5 rounded border ${
										staff.checkedIn
											? "bg-emerald-950/40 border-emerald-700/50"
											: "bg-slate-950/50 border-slate-800/50 opacity-70"
									}`}
								>
									<Avatar className="h-6 w-6">
										<AvatarImage src={staff.avatar ?? undefined} />
										<AvatarFallback className="text-[10px] bg-slate-800 text-slate-300">
											{staff.name.substring(0, 2)}
										</AvatarFallback>
									</Avatar>
									<div className="min-w-0 overflow-hidden">
										<p className="text-xs font-medium truncate text-slate-200">
											{staff.name}
										</p>
										<p className="text-[10px] text-slate-500 truncate">
											{staff.position}
										</p>
										<p
											className={`text-[10px] font-medium truncate ${
												staff.checkedIn
													? staff.isLate
														? "text-amber-400"
														: "text-emerald-400"
													: staff.withinGrace
														? "text-slate-400"
														: "text-amber-400"
											}`}
										>
											{staff.checkedIn
												? `${staff.isLate ? "Late · " : "On post · "}${
														staff.checkedInAt
															? new Date(staff.checkedInAt).toLocaleTimeString(
																	[],
																	{ hour: "2-digit", minute: "2-digit" },
																)
															: ""
													}`
												: staff.withinGrace
													? "Expected"
													: "Not arrived"}
										</p>
									</div>
								</div>
							))}
					</div>
					{(unit.onDutyStaff ?? []).length === 0 && (
						<div className="text-center py-4 text-xs text-slate-600">
							No staff currently logged at this post.
						</div>
					)}
					{canPing && (unit.onDutyStaff ?? []).length > 0 && (
						<PingOnDuty
							postName={
								unit.location && unit.location !== unit.name
									? `${unit.name}, ${unit.location}`
									: unit.name
							}
							officerIds={targets.ids}
							who={targets.who}
							people={(unit.onDutyStaff ?? []).map((s) => ({
								id: s.id,
								name: s.name,
								onPost: s.checkedIn,
							}))}
							buttonClassName="w-full border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 hover:text-white"
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
