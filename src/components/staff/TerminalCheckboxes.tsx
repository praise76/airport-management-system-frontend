import { useTerminals } from "@/hooks/terminals";

/** Reads the stored value, which the API keeps as a JSON text list like '["IT1","GAT"]'. */
export function parseTerminalCodes(value?: string | null): string[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		// Older records may hold "IT1, IT2".
		return value
			.split(",")
			.map((s) => s.trim().replace(/^["[]+|["\]]+$/g, ""))
			.filter(Boolean);
	}
}

/** Tick boxes for the terminals a staff member works in. Saves the same JSON text as before. */
export function TerminalCheckboxes({
	value,
	onChange,
}: {
	value?: string | null;
	onChange: (json: string) => void;
}) {
	const { data: terminals, isLoading } = useTerminals();
	const selected = parseTerminalCodes(value);
	const toggle = (code: string) => {
		const next = selected.includes(code) ? selected.filter((c) => c !== code) : [...selected, code];
		onChange(JSON.stringify(next));
	};

	if (isLoading) return <p className="text-sm text-muted-foreground">Loading terminals…</p>;
	if (!terminals?.length)
		return <p className="text-sm text-muted-foreground">No terminals set up yet. Add them under Terminals.</p>;

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
			{terminals.map((t) => (
				<label
					key={t.id}
					className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40"
				>
					<input
						type="checkbox"
						className="h-4 w-4"
						checked={selected.includes(t.terminalCode)}
						onChange={() => toggle(t.terminalCode)}
					/>
					<span>
						{t.terminalName} <span className="text-muted-foreground">({t.terminalCode})</span>
					</span>
				</label>
			))}
		</div>
	);
}
