import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fullName, type RosterPerson } from "../staffForUnit";

/**
 * Search-and-tick list for putting staff into a roster team.
 * People already in another team are shown with that team's name and can't be ticked twice.
 */
export function MemberPicker({
	people,
	selected,
	onChange,
	takenBy,
}: {
	people: RosterPerson[];
	selected: string[];
	onChange: (ids: string[]) => void;
	/** staffId → name of the other team they're already in */
	takenBy: Map<string, string>;
}) {
	const [q, setQ] = useState("");
	const shown = useMemo(() => {
		const needle = q.trim().toLowerCase();
		if (!needle) return people;
		return people.filter((p) =>
			`${fullName(p)} ${p.position?.name ?? ""} ${(p.employeeId as string) ?? ""}`
				.toLowerCase()
				.includes(needle),
		);
	}, [people, q]);

	const selectable = shown.filter((p) => !takenBy.has(p.id));
	const toggle = (id: string) =>
		onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

	return (
		<div className="rounded-md border">
			<div className="flex flex-wrap items-center gap-2 border-b p-2">
				<div className="relative flex-1 min-w-[180px]">
					<Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search by name, position or staff ID"
						className="pl-8 h-9"
					/>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() =>
						onChange([...new Set([...selected, ...selectable.map((p) => p.id)])])
					}
					disabled={selectable.length === 0}
				>
					Add all shown ({selectable.length})
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => onChange([])}
					disabled={selected.length === 0}
				>
					Clear
				</Button>
			</div>
			<div className="max-h-56 overflow-y-auto divide-y">
				{shown.length === 0 && (
					<p className="p-3 text-sm text-muted-foreground">
						{people.length === 0 ? "Select a unit to see its staff." : "No one matches that search."}
					</p>
				)}
				{shown.map((p) => {
					const other = takenBy.get(p.id);
					const checked = selected.includes(p.id);
					return (
						<label
							key={p.id}
							className={`flex items-center gap-3 px-3 py-2 text-sm ${other ? "opacity-60" : "cursor-pointer hover:bg-muted/40"}`}
						>
							<input
								type="checkbox"
								className="h-4 w-4"
								checked={checked}
								disabled={!!other}
								onChange={() => toggle(p.id)}
							/>
							<span className="flex-1 min-w-0 truncate">
								{fullName(p)}
								{p.position?.name && (
									<span className="text-muted-foreground"> · {p.position.name}</span>
								)}
							</span>
							{other && <span className="text-xs text-muted-foreground">In {other}</span>}
						</label>
					);
				})}
			</div>
			<div className="border-t px-3 py-2 text-xs text-muted-foreground">
				{selected.length} selected
			</div>
		</div>
	);
}
