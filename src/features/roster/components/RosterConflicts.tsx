import { CalendarOff, ChevronDown, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { RosterConflict, RosterConflictType } from "@/types/roster";

export const CONFLICT_TITLES: Record<RosterConflictType, string> = {
	on_leave: "On approved leave",
	double_booked: "Already on a shift in another roster",
	duplicate_in_request: "Assigned more than once here",
};

const CONFLICT_HINTS: Record<RosterConflictType, string> = {
	on_leave: "Approved leave can't be overridden. Choose someone else or change the dates.",
	double_booked: "Each person can only hold one shift a day across every roster and unit.",
	duplicate_in_request: "This person is in more than one team on the same day.",
};

const fmt = (d: string) =>
	new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

/** Lookup used to mark cells in the preview grid: "staffId|YYYY-MM-DD" to its conflicts. */
export function conflictsByCell(conflicts: RosterConflict[] = []): Map<string, RosterConflict[]> {
	const map = new Map<string, RosterConflict[]>();
	for (const c of conflicts) {
		const key = `${c.staffId}|${c.dutyDate}`;
		map.set(key, [...(map.get(key) ?? []), c]);
	}
	return map;
}

/**
 * Problems the server found with the people in a generated roster: approved leave, shifts they
 * already hold elsewhere, and the same person twice. These stop a save unless the conflicting
 * days are skipped, so they are listed ahead of the softer checks.
 */
export function RosterConflictsPanel({
	conflicts,
	className,
}: {
	conflicts: RosterConflict[];
	className?: string;
}) {
	const [open, setOpen] = useState<RosterConflictType | null>("on_leave");
	if (conflicts.length === 0) return null;

	const groups = new Map<RosterConflictType, RosterConflict[]>();
	for (const c of conflicts) groups.set(c.type, [...(groups.get(c.type) ?? []), c]);
	const days = new Set(conflicts.map((c) => `${c.staffId}|${c.dutyDate}`)).size;

	return (
		<div
			role="alert"
			className={cn(
				"rounded-lg border border-red-300 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100",
				className,
			)}
		>
			<div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold">
				<CalendarOff className="h-4 w-4 shrink-0" />
				{days} {days === 1 ? "day" : "days"} can&apos;t be rostered as planned
			</div>
			<div className="divide-y divide-red-200 dark:divide-red-900 border-t border-red-200 dark:border-red-900">
				{[...groups].map(([type, list]) => (
					<div key={type}>
						<button
							type="button"
							onClick={() => setOpen(open === type ? null : type)}
							aria-expanded={open === type}
							className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-red-100/60 dark:hover:bg-red-900/30"
						>
							<span className="flex items-center gap-2">
								<Users className="h-3.5 w-3.5" />
								{CONFLICT_TITLES[type]} <span className="font-semibold">({list.length})</span>
							</span>
							<ChevronDown className={cn("h-4 w-4 transition-transform", open === type && "rotate-180")} />
						</button>
						{open === type && (
							<div className="px-6 pb-3 space-y-2 text-sm">
								<p className="text-xs opacity-80">{CONFLICT_HINTS[type]}</p>
								<ul className="space-y-1 list-disc">
									{list.slice(0, 50).map((c) => (
										<li key={`${c.staffId}-${c.dutyDate}-${c.type}`}>
											<span className="font-medium">{c.staffName}</span>, {fmt(c.dutyDate)}
											{c.type === "on_leave" && c.leaveType ? ` (${c.leaveType} leave)` : ""}
											{c.type === "double_booked" && c.existingShift ? ` (${c.existingShift} shift)` : ""}
										</li>
									))}
									{list.length > 50 && <li>…and {list.length - 50} more.</li>}
								</ul>
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
