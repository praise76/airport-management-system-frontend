import { AlertTriangle, CheckCircle2, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
	type RosterWarning,
	type RosterWarningKind,
	WARNING_TITLES,
} from "../rosterChecks";

/** Summary of roster problems, grouped by type, with the details folded away. */
export function RosterWarnings({
	warnings,
	className,
}: {
	warnings: RosterWarning[];
	className?: string;
}) {
	const [open, setOpen] = useState<RosterWarningKind | null>(null);

	if (warnings.length === 0) {
		return (
			<div
				className={cn(
					"flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
					className,
				)}
			>
				<CheckCircle2 className="h-4 w-4 shrink-0" />
				No problems found: rest times, double bookings, days in a row and shift cover all look fine.
			</div>
		);
	}

	const groups = new Map<RosterWarningKind, RosterWarning[]>();
	for (const w of warnings) groups.set(w.kind, [...(groups.get(w.kind) ?? []), w]);

	return (
		<div
			className={cn(
				"rounded-lg border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100",
				className,
			)}
		>
			<div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold">
				<AlertTriangle className="h-4 w-4 shrink-0" />
				{warnings.length} {warnings.length === 1 ? "problem" : "problems"} to check before publishing
			</div>
			<div className="divide-y divide-amber-200 dark:divide-amber-900 border-t border-amber-200 dark:border-amber-900">
				{[...groups].map(([kind, list]) => (
					<div key={kind}>
						<button
							type="button"
							onClick={() => setOpen(open === kind ? null : kind)}
							className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-amber-100/60 dark:hover:bg-amber-900/30"
							aria-expanded={open === kind}
						>
							<span>
								{WARNING_TITLES[kind]} <span className="font-semibold">({list.length})</span>
							</span>
							<ChevronDown
								className={cn("h-4 w-4 transition-transform", open === kind && "rotate-180")}
							/>
						</button>
						{open === kind && (
							<ul className="space-y-1 px-6 pb-3 text-sm list-disc">
								{list.slice(0, 50).map((w, i) => (
									<li key={`${w.date}-${w.staffId ?? ""}-${i}`}>{w.message}</li>
								))}
								{list.length > 50 && <li>…and {list.length - 50} more.</li>}
							</ul>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
