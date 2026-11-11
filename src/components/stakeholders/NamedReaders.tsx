import { Eye, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePositions } from "@/hooks/positions";
import { useNamedReaders, useSaveNamedReaders } from "@/hooks/stakeholder-portal";
import type { RoutedKind } from "@/types/stakeholder-portal";

const READER_KINDS: { kind: RoutedKind; title: string }[] = [
	{ kind: "permits", title: "Permits" },
	{ kind: "activities", title: "Requests" },
	{ kind: "invoices", title: "Invoices" },
];

/**
 * Need-to-know: an item's minutes, the names of who acted and the files attached to its minutes
 * are visible to the offices the item has passed through. A named reader is a position that may
 * read ALL items of one kind, e.g. a director who must see everything in a stream. Every such
 * read is logged for audit. Empty by default.
 */
function NamedReadersCard({ kind, title }: { kind: RoutedKind; title: string }) {
	const readers = useNamedReaders();
	const save = useSaveNamedReaders();
	const positions = usePositions();
	const [choice, setChoice] = useState("");
	const current = readers.data?.[kind] ?? [];
	const available = (positions.data ?? []).filter(
		(p) => !current.some((r) => r.positionId === p.id),
	);

	return (
		<div className="space-y-2 rounded-md border p-3" data-testid={`readers-${kind}`}>
			<h3 className="text-sm font-medium">{title}</h3>
			{readers.isLoading ? (
				<p className="text-sm text-muted-foreground">Loading…</p>
			) : readers.isError ? (
				<p role="alert" className="text-sm text-destructive">
					Couldn't load the named readers.
				</p>
			) : (
				<>
					{current.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No named readers. Only the offices an item has passed through (and
							auditors and super admins) can read its minutes.
						</p>
					) : (
						<ul className="flex flex-wrap gap-2">
							{current.map((r) => (
								<li key={r.positionId}>
									<Badge variant="secondary" className="gap-1 pr-1">
										{r.title}
										<button
											type="button"
											className="rounded p-0.5 hover:bg-background/60 disabled:opacity-50"
											aria-label={`Remove ${r.title} as a reader of ${title.toLowerCase()}`}
											disabled={save.isPending}
											onClick={() =>
												save.mutate({
													kind,
													positionIds: current
														.filter((x) => x.positionId !== r.positionId)
														.map((x) => x.positionId),
												})
											}
										>
											<X className="h-3 w-3" aria-hidden />
										</button>
									</Badge>
								</li>
							))}
						</ul>
					)}
					<div className="flex flex-wrap items-end gap-2">
						<div className="space-y-1.5">
							<Label htmlFor={`reader-${kind}`}>Add a position</Label>
							<Select value={choice} onValueChange={setChoice}>
								<SelectTrigger id={`reader-${kind}`} className="w-64">
									<SelectValue
										placeholder={positions.isLoading ? "Loading positions…" : "Choose a position"}
									/>
								</SelectTrigger>
								<SelectContent className="max-h-72">
									{available.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.title}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							disabled={!choice || save.isPending}
							onClick={() =>
								save.mutate(
									{ kind, positionIds: [...current.map((r) => r.positionId), choice] },
									{ onSuccess: () => setChoice("") },
								)
							}
						>
							{save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
							Add
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

export function NamedReadersSection() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Eye className="h-4 w-4" aria-hidden />
					Who can read all minutes
				</CardTitle>
				<CardDescription>
					An item's minutes, the names of who acted and the files attached to its
					minutes are visible only to the offices it has passed through. A position
					added here can read every item of that kind, without it ever having been
					with them. Super admins and auditors can always read, and every read made
					this way is logged.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				{READER_KINDS.map((k) => (
					<NamedReadersCard key={k.kind} kind={k.kind} title={k.title} />
				))}
			</CardContent>
		</Card>
	);
}
