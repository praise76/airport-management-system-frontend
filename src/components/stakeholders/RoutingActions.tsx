import { CornerUpLeft, Forward, History, Inbox, Loader2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDepartmentTree } from "@/hooks/departments";
import { usePositions } from "@/hooks/positions";
import {
	useAcknowledgeItem,
	useForwardItem,
	useItemTrail,
	useReturnItem,
} from "@/hooks/stakeholder-portal";
import { useDepartmentStaff } from "@/hooks/users";
import {
	fallbackTrail,
	holdsItem,
	isOpen,
	assignedWithinOffice,
	returnTarget,
} from "@/lib/routing";
import { useAuthStore } from "@/stores/auth";
import type { DepartmentTreeNode } from "@/types/department";
import type {
	ForwardInput,
	OfficeType,
	RoutedKind,
	RoutingFields,
	TrailAttachment,
} from "@/types/stakeholder-portal";
import { AttachmentPicker } from "./AttachmentPicker";
import { CurrentlyWith, PermitTrail } from "./PermitTrail";

/**
 * Staff actions that move a permit, request or invoice down and back up the chain of offices:
 *
 *   RGM minutes to the HOD of a department,
 *   the HOD minutes to the head of a unit (or a member of staff),
 *   each treats it and returns it up the chain,
 *   and the RGM minutes it on (to Accounts, say).
 */

type Routed = {
	id: string;
	status: string;
	createdAt: string;
	submittedAt?: string;
	approvedAt?: string;
	reviewedAt?: string;
} & RoutingFields;

export type OfficeOption = {
	value: string;
	id: string;
	type: OfficeType;
	/** Plain name, e.g. "Environmental Services". */
	name: string;
	/** Indented name for the full list. */
	label: string;
	parentId?: string | null;
	level?: number;
};

const LEVEL: Record<number, OfficeType> = { 1: "department", 2: "unit", 3: "unit" };

function flatten(
	nodes: DepartmentTreeNode[],
	depth = 0,
	out: OfficeOption[] = [],
): OfficeOption[] {
	for (const n of nodes) {
		const type = LEVEL[n.departmentLevel] ?? "department";
		out.push({
			value: `${type}:${n.id}`,
			id: n.id,
			type,
			name: n.name,
			label: `${"— ".repeat(depth)}${n.name}`,
			parentId: n.parentDepartmentId,
			level: n.departmentLevel,
		});
		if (n.children?.length) flatten(n.children, depth + 1, out);
	}
	return out;
}

/** Every office an item can be minuted to: departments, units and positions. */
export function useOffices() {
	const tree = useDepartmentTree();
	const positions = usePositions();
	const all = useMemo<OfficeOption[]>(
		() => [
			...flatten(tree.data ?? []),
			...(positions.data ?? []).map((p) => ({
				value: `position:${p.id}`,
				id: p.id,
				type: "position" as const,
				name: p.title,
				label: `${p.title} (position)`,
			})),
		],
		[tree.data, positions.data],
	);
	return { all, loading: tree.isLoading };
}

/**
 * The next offices down the chain from the one that holds the item.
 * - Held by a position (the RGM) or unknown: the departments, i.e. their HODs.
 * - Held by a department (its HOD): that department's units, or its own staff.
 * - Held by a unit (its head): the unit's own staff.
 */
export function nextOffices(
	all: OfficeOption[],
	holder: { id?: string; type?: OfficeType },
): { options: (OfficeOption & { hint: string; ownStaff?: boolean })[]; heading: string } {
	const me = all.find((o) => o.id === holder.id);
	const type = holder.type ?? me?.type;
	if (me && (type === "department" || type === "unit")) {
		const units = all.filter((o) => o.parentId === me.id);
		return {
			heading: type === "department" ? "Minute to a unit or a member of staff" : "Minute to a member of staff",
			options: [
				...units.map((o) => ({ ...o, hint: `Head of unit, ${o.name}` })),
				{ ...me, hint: `A member of staff in ${me.name}`, ownStaff: true },
			],
		};
	}
	return {
		heading: "Minute to a department",
		options: all
			.filter((o) => o.type === "department" && (o.level ?? 1) === 1)
			.map((o) => ({ ...o, hint: `HOD, ${o.name}` })),
	};
}

const MIN_MINUTE = 5;

/** Pick who it goes to next and write the minute. */
export function ForwardDialog({
	open,
	onOpenChange,
	title,
	holder,
	busy,
	onForward,
	kind,
	itemId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	/** The office that holds the item now. */
	holder: { id?: string; type?: OfficeType };
	busy?: boolean;
	onForward: (input: ForwardInput) => void;
	/** With these, the minute can carry attached files. */
	kind?: RoutedKind;
	itemId?: string;
}) {
	const ids = { office: useId(), officer: useId(), minute: useId() };
	const [office, setOffice] = useState("");
	const [officer, setOfficer] = useState("");
	const [minute, setMinute] = useState("");
	const [files, setFiles] = useState<TrailAttachment[]>([]);
	const [showAll, setShowAll] = useState(false);
	// Files already uploaded for a dialog that was closed without sending are dropped.
	useEffect(() => {
		if (!open) setFiles([]);
	}, [open]);
	const { all, loading } = useOffices();
	const next = useMemo(() => nextOffices(all, holder), [all, holder]);

	const options = showAll
		? all.map((o) => ({ ...o, hint: o.label, ownStaff: false }))
		: next.options;
	const chosen = options.find((o) => o.value === office);
	const ownStaff = !!chosen && chosen.id === holder.id;
	// Any staff member may read a department's people (id and name), unlike the admin list.
	const staff = useDepartmentStaff(
		chosen && chosen.type !== "position" ? chosen.id : undefined,
	);
	const officers =
		chosen && chosen.type !== "position" ? (staff.data ?? []) : [];
	// Minuting within your own office only makes sense to a named person.
	const needsOfficer = ownStaff && !officer;
	const tooShort = minute.trim().length < MIN_MINUTE;

	const reset = () => {
		setOffice("");
		setOfficer("");
		setMinute("");
		setFiles([]);
		setShowAll(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) reset();
				onOpenChange(o);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						The company is told which office now has it. They don't see your
						minute or anyone's name.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor={ids.office}>
							{showAll ? "Minute to any office" : next.heading}
						</Label>
						<Select
							value={office}
							onValueChange={(v) => {
								setOffice(v);
								setOfficer("");
							}}
						>
							<SelectTrigger id={ids.office} className="w-full">
								<SelectValue
									placeholder={loading ? "Loading offices…" : "Choose who it goes to"}
								/>
							</SelectTrigger>
							<SelectContent className="max-h-72">
								{options.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.hint}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<button
							type="button"
							className="text-xs text-primary hover:underline"
							onClick={() => {
								setShowAll((v) => !v);
								setOffice("");
								setOfficer("");
							}}
						>
							{showAll ? "Show only the next offices" : "Send to a different office"}
						</button>
					</div>
					{chosen && chosen.type !== "position" && (
						<div className="space-y-1.5">
							<Label htmlFor={ids.officer}>
								{ownStaff ? "Member of staff" : "Named officer (optional)"}
							</Label>
							<Select
								value={officer || "none"}
								onValueChange={(v) => setOfficer(v === "none" ? "" : v)}
							>
								<SelectTrigger id={ids.officer} className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									<SelectItem value="none">
										{ownStaff ? "Choose a person" : `The head of ${chosen.name}`}
									</SelectItem>
									{officers.map((u) => (
										<SelectItem key={u.id} value={u.id}>
											{[u.firstName, u.lastName].filter(Boolean).join(" ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{staff.isError && (
								<p className="text-xs text-muted-foreground">
									The staff list for this office isn't available to your account.
								</p>
							)}
						</div>
					)}
					<div className="space-y-1.5">
						<Label htmlFor={ids.minute}>Minute</Label>
						<Textarea
							id={ids.minute}
							value={minute}
							onChange={(e) => setMinute(e.target.value)}
							rows={4}
							placeholder="What should they do?"
						/>
						<p className="text-xs text-muted-foreground">Required. Staff only.</p>
					</div>
					{kind && itemId && (
						<AttachmentPicker kind={kind} itemId={itemId} value={files} onChange={setFiles} />
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={busy || !chosen || needsOfficer || tooShort}
						onClick={() =>
							chosen &&
							onForward({
								toOfficeId: chosen.id,
								toOfficeType: chosen.type,
								toOfficerId: officer || undefined,
								minute: minute.trim(),
								attachments: files.length ? files.map((f) => f.id) : undefined,
							})
						}
					>
						{busy ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Forward className="h-4 w-4" />
						)}
						Minute
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** A required internal minute, used when treating an item and returning it up the chain. */
function ReturnDialog({
	open,
	onOpenChange,
	title,
	to,
	busy,
	onConfirm,
	kind,
	itemId,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	to: string;
	busy?: boolean;
	onConfirm: (minute: string, attachments: string[]) => void;
	/** With these, the minute can carry attached files (e.g. the treated job completion). */
	kind?: RoutedKind;
	itemId?: string;
}) {
	const id = useId();
	const [minute, setMinute] = useState("");
	const [files, setFiles] = useState<TrailAttachment[]>([]);
	useEffect(() => {
		if (!open) setFiles([]);
	}, [open]);
	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) setMinute("");
				onOpenChange(o);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						It goes back up to {to}. The company sees the office, not your minute.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-1.5">
					<Label htmlFor={id}>Minute</Label>
					<Textarea
						id={id}
						value={minute}
						onChange={(e) => setMinute(e.target.value)}
						rows={4}
						placeholder="What you did, or what you found"
					/>
					<p className="text-xs text-muted-foreground">Required. Staff only.</p>
				</div>
				{kind && itemId && (
					<AttachmentPicker kind={kind} itemId={itemId} value={files} onChange={setFiles} />
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={busy || minute.trim().length < MIN_MINUTE}
						onClick={() => onConfirm(minute.trim(), files.map((f) => f.id))}
					>
						{busy ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<CornerUpLeft className="h-4 w-4" />
						)}
						Return
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Staff timeline with minutes and names, plus "Acknowledge receipt" for the receiving office. */
function TimelineDialog({
	open,
	onOpenChange,
	kind,
	item,
	title,
	mayAct,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	kind: RoutedKind;
	item: Routed;
	title: string;
	mayAct: boolean;
}) {
	const trail = useItemTrail(kind, item.id, open);
	const acknowledge = useAcknowledgeItem(kind);
	const steps =
		trail.data && trail.data.length > 0 ? trail.data : fallbackTrail(item);
	const last = steps[steps.length - 1]?.stepType;
	const canAcknowledge =
		mayAct && !!trail.data?.length && (last === "forwarded" || last === "returned");
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>
						Every office it has passed through, with the minute at each step.
					</DialogDescription>
				</DialogHeader>
				<CurrentlyWith item={item} surface="staff" />
				{trail.isLoading ? (
					<p className="text-sm text-muted-foreground">Loading timeline…</p>
				) : trail.isError ? (
					<p role="alert" className="text-sm text-destructive">
						Couldn't load the timeline. Close this and open it again.
					</p>
				) : (
					<PermitTrail steps={steps} surface="staff" kind={kind} itemId={item.id} />
				)}
				<DialogFooter>
					{canAcknowledge && (
						<Button
							variant="outline"
							disabled={acknowledge.isPending}
							onClick={() => acknowledge.mutate(item.id)}
						>
							{acknowledge.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Inbox className="h-4 w-4" />
							)}
							Acknowledge receipt
						</Button>
					)}
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Timeline, Return and Minute for one row. Return and Minute appear only while the item is
 * open, the server says which office holds it, and that office is the user's (or the user is a
 * super admin). Return names the office above in the chain and is hidden at the top of it.
 */
export function RoutingButtons({
	kind,
	item,
	name,
	held,
}: {
	kind: RoutedKind;
	item: Routed;
	name: string;
	/** True when the server has already said the user's office holds it ("With my office"). */
	held?: boolean;
}) {
	const user = useAuthStore((st) => st.user);
	const [dialog, setDialog] = useState<"timeline" | "forward" | "return" | null>(
		null,
	);
	const forward = useForwardItem(kind);
	const back = useReturnItem(kind);
	const mayAct =
		isOpen(kind, item.status) &&
		!!item.currentOffice &&
		(held ?? holdsItem(user, item));
	// The chain is read from the trail, so only fetch it for someone who can act.
	const trail = useItemTrail(kind, item.id, mayAct);
	const up = mayAct && trail.data ? returnTarget(trail.data) : null;
	// A person the head of the office minuted it to hands it back to that head.
	const handBack =
		mayAct && !!trail.data && assignedWithinOffice(trail.data, item.currentOfficerId);
	const target = handBack
		? { id: item.currentOfficeId ?? "", name: `the head of ${item.currentOffice}` }
		: up;
	const close = (o: boolean) => !o && setDialog(null);

	// The server sends a return up the chain (to the office above, or to the head of the office
	// when a named person hands it back), so a return is always just a return.
	const sendBack = (minute: string, attachments: string[]) => {
		back.mutate(
			{ id: item.id, minute, attachments: attachments.length ? attachments : undefined },
			{ onSuccess: () => setDialog(null) },
		);
	};

	return (
		<>
			<div className="flex flex-wrap gap-2">
				<Button size="sm" variant="ghost" onClick={() => setDialog("timeline")}>
					<History className="h-4 w-4" /> Timeline
				</Button>
				{mayAct && (
					<>
						{target && (
							<Button size="sm" variant="outline" onClick={() => setDialog("return")}>
								<CornerUpLeft className="h-4 w-4" /> Return to {target.name}
							</Button>
						)}
						<Button size="sm" variant="outline" onClick={() => setDialog("forward")}>
							<Forward className="h-4 w-4" /> Minute to…
						</Button>
					</>
				)}
			</div>
			<TimelineDialog
				open={dialog === "timeline"}
				onOpenChange={close}
				kind={kind}
				item={item}
				title={`Timeline: ${name}`}
				mayAct={mayAct}
			/>
			<ForwardDialog
				open={dialog === "forward"}
				onOpenChange={close}
				title={`Minute ${name}`}
				holder={{ id: item.currentOfficeId, type: item.currentOfficeType }}
				kind={kind}
				itemId={item.id}
				busy={forward.isPending}
				onForward={(input) =>
					forward.mutate({ id: item.id, input }, { onSuccess: () => setDialog(null) })
				}
			/>
			{target && (
				<ReturnDialog
					open={dialog === "return"}
					onOpenChange={close}
					title={`Return ${name}`}
					to={target.name}
					kind={kind}
					itemId={item.id}
					busy={back.isPending}
					onConfirm={sendBack}
				/>
			)}
		</>
	);
}
