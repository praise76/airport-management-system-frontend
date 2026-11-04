import { eachDayOfInterval, format, parseISO } from "date-fns";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export interface PreviewEntry {
	staffId: string;
	dutyDate: string;
	shift: string;
	shiftStartTime?: string;
	shiftEndTime?: string;
}

const COLOURS: Record<string, string> = {
	morning: "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/40 dark:text-yellow-100",
	afternoon: "bg-orange-100 text-orange-900 dark:bg-orange-900/40 dark:text-orange-100",
	night: "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100",
};

/**
 * The generated roster as a staff × day grid, the same shape as the planner's Staff View,
 * so gaps and clashes are visible before saving. Empty cells are days off.
 */
export function RosterPreviewGrid({
	entries,
	startDate,
	endDate,
	nameOf,
}: {
	entries: PreviewEntry[];
	startDate: string;
	endDate: string;
	nameOf: (staffId: string) => string;
}) {
	const dates = useMemo(() => {
		try {
			return eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
		} catch {
			return [];
		}
	}, [startDate, endDate]);

	const { staff, cell } = useMemo(() => {
		const map = new Map<string, PreviewEntry[]>();
		const ids: string[] = [];
		for (const e of entries) {
			if (!ids.includes(e.staffId)) ids.push(e.staffId);
			const k = `${e.staffId}|${e.dutyDate.slice(0, 10)}`;
			map.set(k, [...(map.get(k) ?? []), e]);
		}
		ids.sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
		return { staff: ids, cell: (id: string, d: string) => map.get(`${id}|${d}`) ?? [] };
	}, [entries, nameOf]);

	if (entries.length === 0) {
		return (
			<p className="p-8 text-center text-sm text-muted-foreground">
				No shifts were generated. Check the dates, template and team members.
			</p>
		);
	}

	return (
		<div className="overflow-auto max-h-[560px] rounded-md border">
			<table className="text-xs border-collapse">
				<thead className="sticky top-0 z-20 bg-muted">
					<tr>
						<th className="sticky left-0 z-30 bg-muted p-2 text-left min-w-[160px] border-b border-r">
							Staff
						</th>
						{dates.map((d) => (
							<th key={d.toISOString()} className="p-1.5 border-b min-w-[52px] font-medium">
								<div>{format(d, "EEE")}</div>
								<div className="text-muted-foreground font-normal">{format(d, "d MMM")}</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{staff.map((id) => (
						<tr key={id}>
							<td className="sticky left-0 z-10 bg-card p-2 border-b border-r font-medium whitespace-nowrap">
								{nameOf(id)}
							</td>
							{dates.map((d) => {
								const key = format(d, "yyyy-MM-dd");
								const list = cell(id, key);
								return (
									<td key={key} className="border-b p-0.5 text-center">
										{list.map((e, i) => (
											<div
												key={i}
												title={`${e.shift} ${e.shiftStartTime?.slice(0, 5) ?? ""}–${e.shiftEndTime?.slice(0, 5) ?? ""}`}
												className={cn(
													"rounded px-1 py-1 font-semibold uppercase",
													COLOURS[e.shift?.toLowerCase()] ?? "bg-muted",
													list.length > 1 && "ring-2 ring-red-500",
												)}
											>
												{e.shift?.slice(0, 3)}
											</div>
										))}
									</td>
								);
							})}
						</tr>
					))}
				</tbody>
			</table>
			<p className="p-2 text-xs text-muted-foreground border-t">
				MOR = morning, AFT = afternoon, NIG = night. Empty = day off. Red outline = two shifts on one day.
			</p>
		</div>
	);
}
