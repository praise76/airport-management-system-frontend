import { useEffect, useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { searchUsers } from "@/api/messaging";
import type { User } from "@/types/messaging";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { label } from "@/lib/labels";
import { cn } from "@/lib/utils";

/**
 * Type-to-search picker for choosing a colleague.
 *
 * Why this exists (QA finding RST-05 / LV-06 / DOC-01): the swap, leave-handover and
 * document-assign pickers loaded people from `GET /admin/staff`, which the server refuses
 * (403) for everyone except admins, so ordinary staff always saw an empty list.
 * `GET /messages/users/search?q=` is open to every signed-in user and returns
 * id, name, role and departmentId (max 20 per call), so we search it as the user types.
 */
export type ColleaguePickerProps = {
	value?: string;
	onChange: (id: string | undefined, person?: User) => void;
	/** Only show people in this department (matched on the departmentId the search returns). */
	departmentId?: string | null;
	/** Only show people with one of these roles (lower-case, e.g. ["hod","manager","officer"]). */
	roles?: string[];
	/** Never show these user ids (typically the signed-in user). */
	excludeIds?: (string | undefined | null)[];
	placeholder?: string;
	disabled?: boolean;
	id?: string;
	/** Name to show for an already-selected value that isn't in the current results. */
	selectedLabel?: string;
};

function useDebounced<T>(value: T, ms = 250): T {
	const [v, setV] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setV(value), ms);
		return () => clearTimeout(t);
	}, [value, ms]);
	return v;
}

export function ColleaguePicker({
	value,
	onChange,
	departmentId,
	roles,
	excludeIds = [],
	placeholder = "Choose a colleague",
	disabled,
	id,
	selectedLabel,
}: ColleaguePickerProps) {
	const autoId = useId();
	const inputId = id ?? `colleague-${autoId}`;
	const [open, setOpen] = useState(false);
	const [q, setQ] = useState("");
	const [picked, setPicked] = useState<User | undefined>();
	const term = useDebounced(q.trim());

	const { data, isFetching, isError } = useQuery({
		queryKey: ["colleague-search", term, departmentId ?? null],
		queryFn: () => searchUsers({ q: term, limit: 20, departmentId: departmentId || undefined }),
		enabled: open && term.length >= 1,
		staleTime: 30_000,
	});

	const allowedRoles = roles?.map((r) => r.toLowerCase());
	const excluded = new Set(excludeIds.filter(Boolean) as string[]);
	const results = (data ?? []).filter(
		(u) =>
			!excluded.has(u.id) &&
			(!departmentId || !u.departmentId || u.departmentId === departmentId) &&
			(!allowedRoles || allowedRoles.includes(String(u.role ?? "").toLowerCase())),
	);

	const shown =
		picked && picked.id === value
			? `${picked.firstName} ${picked.lastName}`
			: value
				? (selectedLabel ?? "Selected colleague")
				: undefined;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					aria-controls={`${inputId}-list`}
					disabled={disabled}
					className="w-full justify-between font-normal"
				>
					<span className={cn("truncate", !shown && "text-muted-foreground")}>{shown ?? placeholder}</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] min-w-64 p-2" align="start">
				<label htmlFor={inputId} className="sr-only">
					Search colleagues by name
				</label>
				<div className="relative">
					<Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						id={inputId}
						autoFocus
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Type a name…"
						className="pl-8"
					/>
				</div>
				<div id={`${inputId}-list`} role="listbox" className="mt-2 max-h-64 overflow-y-auto">
					{term.length === 0 && (
						<p className="p-2 text-sm text-muted-foreground">Type at least one letter of their name.</p>
					)}
					{term.length > 0 && isFetching && (
						<p className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" /> Searching…
						</p>
					)}
					{term.length > 0 && isError && (
						<p className="p-2 text-sm text-destructive">Couldn't search staff. Check your connection and try again.</p>
					)}
					{term.length > 0 && !isFetching && !isError && results.length === 0 && (
						<p className="p-2 text-sm text-muted-foreground">No matching colleagues.</p>
					)}
					{results.map((u) => (
						<button
							key={u.id}
							type="button"
							role="option"
							aria-selected={u.id === value}
							onClick={() => {
								setPicked(u);
								onChange(u.id, u);
								setOpen(false);
							}}
							className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
						>
							<span>
								{u.firstName} {u.lastName}
								{u.role && <span className="ml-2 text-xs text-muted-foreground">{label(u.role)}</span>}
							</span>
							{u.id === value && <Check className="h-4 w-4" />}
						</button>
					))}
				</div>
				{value && (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="mt-1 w-full"
						onClick={() => {
							setPicked(undefined);
							onChange(undefined);
							setOpen(false);
						}}
					>
						Clear selection
					</Button>
				)}
			</PopoverContent>
		</Popover>
	);
}
