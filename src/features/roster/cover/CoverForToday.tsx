import { Input } from "@/components/ui/input";
import { ArrowRightLeft, Undo2 } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useCoverRosterEntry } from "@/features/roster/api";
import type { RosterEntry } from "@/features/roster/types";
import { useAllDepartments } from "@/hooks/departments";
import { useTerminals } from "@/hooks/terminals";
import {
	isCovering,
	usualPostOf,
	stationTerminal,
} from "./cover";

const lagosToday = () =>
	new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

interface Props {
	rosterId: string;
	entries: RosterEntry[];
	/** staff id → name */
	nameOf: (staffId: string) => string;
}

/**
 * Send an officer on this roster to cover another post (any unit's station) for today's shift
 * only. Their entry for today takes the other post and its terminal; undoing puts their usual
 * post back. Check-in at the covered post then matches their roster.
 */
export function CoverForToday({ rosterId, entries, nameOf }: Props) {
	const [open, setOpen] = useState(false);
	const whoId = useId();
	const whereId = useId();
	const [entryId, setEntryId] = useState("");
	const [stationId, setStationId] = useState("");
	const [reason, setReason] = useState("");
	const { data: departments } = useAllDepartments();
	const { data: terminals } = useTerminals();
	const update = useCoverRosterEntry();
	const today = lagosToday();

	const todays = useMemo(
		() =>
			entries
				.filter((e) => String(e.dutyDate).slice(0, 10) === today)
				.sort((a, b) => nameOf(a.staffId).localeCompare(nameOf(b.staffId))),
		[entries, today, nameOf],
	);
	const covering = todays.filter((e) => isCovering(e.dutyPosition));

	// Live stations grouped by unit, for the "Post to cover" list.
	const groups = useMemo(() => {
		const all = (departments ?? []).filter((d) => !d.archivedAt);
		const byId = new Map(all.map((d) => [d.id, d]));
		const out = new Map<
			string,
			{ id: string; name: string; terminalCodes: unknown }[]
		>();
		for (const s of all.filter((d) => d.departmentLevel === 3)) {
			const unit = s.parentDepartmentId
				? byId.get(s.parentDepartmentId)?.name
				: undefined;
			const key = unit ?? "Other";
			out.set(key, [...(out.get(key) ?? []), s]);
		}
		return [...out.entries()].sort(([a], [b]) => a.localeCompare(b));
	}, [departments]);
	const stationById = (id: string) =>
		groups.flatMap(([, l]) => l).find((s) => s.id === id);
	const terminalId = (code?: string) =>
		(terminals ?? []).find((t) => t.terminalCode === code)?.id;

	const entry = todays.find((e) => e.id === entryId);
	const station = stationById(stationId);

	const send = () => {
		if (!entry || !station) return;

		update.mutate(
			{
				rosterId,
				entryId: entry.id,
				updates: {
					dutyLocation: station.name,
					stationId: station.id,
					reason,
					...(terminalId(stationTerminal(station.terminalCodes))
						? { terminalId: terminalId(stationTerminal(station.terminalCodes)) }
						: {}),
				},
			},
			{
				onSuccess: () => {
					toast.success(
						`${nameOf(entry.staffId)} covers ${station.name} today.`,
					);
					setOpen(false);
					setEntryId("");
					setStationId("");
				},
				onError: () => toast.error("The cover was not saved. Try again."),
			},
		);
	};

	const undo = (e: RosterEntry) => {

		update.mutate(
			{
				rosterId,
				entryId: e.id,
				updates: null,
			},
			{
				onSuccess: () =>
					toast.success(
						`${nameOf(e.staffId)} is back on their normal post.`,
					),
			},
		);
	};

	return (
		<>
			<Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
				<ArrowRightLeft className="h-4 w-4" /> Cover for today
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Cover for today</DialogTitle>
						<DialogDescription>
							Send someone on this roster to another post for today's shift
							only. Their usual post comes back tomorrow, or when you undo it.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={whoId}>Who</Label>
							<Select value={entryId} onValueChange={setEntryId}>
								<SelectTrigger id={whoId}>
									<SelectValue
										placeholder={
											todays.length
												? "Choose an officer on today's roster"
												: "Nobody on this roster today"
										}
									/>
								</SelectTrigger>
								<SelectContent>
									{todays.map((e) => (
										<SelectItem key={e.id} value={e.id}>
											{nameOf(e.staffId)} · {e.shift} ·{" "}
											{e.dutyLocation || "no post"}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor={whereId}>Post to cover</Label>
							<Select value={stationId} onValueChange={setStationId}>
								<SelectTrigger id={whereId}>
									<SelectValue placeholder="Choose a station" />
								</SelectTrigger>
								<SelectContent className="max-h-80">
									{groups.map(([unit, list]) => (
										<SelectGroup key={unit}>
											<SelectLabel>{unit}</SelectLabel>
											{list.map((s) => (
												<SelectItem key={s.id} value={s.id}>
													{s.name}
												</SelectItem>
											))}
										</SelectGroup>
									))}
								</SelectContent>
							</Select>
						</div>
						{entry && station && (
							<p className="rounded-md bg-muted/50 p-3 text-sm">
								{nameOf(entry.staffId)} leaves{" "}
								<b>{entry.dutyLocation || "their post"}</b> and covers{" "}
								<b>{station.name}</b> for today's {entry.shift} shift. They
								check in there, and its station chat opens for them.
							</p>
						)}
						{covering.length > 0 && (
							<div className="space-y-2">
								<Label>Covering today</Label>
								<ul className="space-y-1 text-sm">
									{covering.map((e) => (
										<li
											key={e.id}
											className="flex items-center justify-between gap-2"
										>
											<span>
												{nameOf(e.staffId)}: {e.dutyLocation} (normally{" "}
												{e.coverFromLocation ?? usualPostOf(e.dutyPosition) ?? "another post"})
											</span>
											<Button
												size="sm"
												variant="ghost"
												className="gap-1"
												onClick={() => undo(e)}
											>
												<Undo2 className="h-3.5 w-3.5" /> Undo
											</Button>
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
					<Label htmlFor="cover-reason">Reason for cover</Label>
					<Input id="cover-reason" value={reason} onChange={e=>setReason(e.target.value)} maxLength={2000} placeholder="Why is this cover needed?"/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setOpen(false)}>
							Close
						</Button>
						<Button
							onClick={send}
							disabled={!entry || !station || !reason.trim() || update.isPending}
						>
							Send to cover
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
