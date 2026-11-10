import { CornerUpLeft, Forward, History, Inbox, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { useUsers } from "@/hooks/users";
import { fallbackTrail, holdsItem, isOpen } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth";
import type { DepartmentTreeNode } from "@/types/department";
import type {
	OfficeType,
	RoutedKind,
	RoutingFields,
} from "@/types/stakeholder-portal";
import { CurrentlyWith, PermitTrail } from "./PermitTrail";

/** Staff actions that move a permit, activity or invoice between offices. */

type Routed = {
	id: string;
	status: string;
	createdAt: string;
	submittedAt?: string;
	approvedAt?: string;
	reviewedAt?: string;
} & RoutingFields;

type OfficeOption = {
	value: string;
	id: string;
	type: OfficeType;
	label: string;
};
const LEVEL: Record<number, OfficeType> = {
	1: "department",
	2: "unit",
	3: "unit",
};

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
			label: `${"— ".repeat(depth)}${n.name}`,
		});
		if (n.children?.length) flatten(n.children, depth + 1, out);
	}
	return out;
}

const MIN_MINUTE = 5;

/** Pick the next office (and optionally an officer in it) and write the minute. */
export function ForwardDialog({
	open,
	onOpenChange,
	title,
	currentOfficeId,
	busy,
	onForward,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	currentOfficeId?: string;
	busy?: boolean;
	onForward: (input: {
		toOfficeId: string;
		toOfficeType: OfficeType;
		toOfficerId?: string;
		minute: string;
	}) => void;
}) {
	const [office, setOffice] = useState("");
	const [officer, setOfficer] = useState("");
	const [minute, setMinute] = useState("");
	const tree = useDepartmentTree();
	const positions = usePositions();

	const offices = useMemo<OfficeOption[]>(
		() => [
			...flatten(tree.data ?? []),
			...(positions.data ?? []).map((p) => ({
				value: `position:${p.id}`,
				id: p.id,
				type: "position" as const,
				label: `${p.title} (position)`,
			})),
		],
		[tree.data, positions.data],
	);
	const chosen = offices.find((o) => o.value === office);
	const sameOffice = !!chosen && chosen.id === currentOfficeId;
	const staff = useUsers(
		chosen && chosen.type !== "position"
			? { departmentId: chosen.id, limit: 100 }
			: undefined,
	);
	const officers =
		chosen && chosen.type !== "position" ? (staff.data?.data ?? []) : [];
	const tooShort = minute.trim().length < MIN_MINUTE;

	const reset = () => {
		setOffice("");
		setOfficer("");
		setMinute("");
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
						minute or your name.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-1.5">
						<Label htmlFor="fwd-office">Forward to office</Label>
						<Select
							value={office}
							onValueChange={(v) => {
								setOffice(v);
								setOfficer("");
							}}
						>
							<SelectTrigger id="fwd-office" className="w-full">
								<SelectValue
									placeholder={
										tree.isLoading ? "Loading offices…" : "Choose an office"
									}
								/>
							</SelectTrigger>
							<SelectContent className="max-h-72">
								{offices.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{sameOffice && (
							<p role="alert" className="text-xs text-destructive">
								This office already holds it. Choose a different office.
							</p>
						)}
					</div>
					{chosen && chosen.type !== "position" && (
						<div className="space-y-1.5">
							<Label htmlFor="fwd-officer">Named officer (optional)</Label>
							<Select
								value={officer || "none"}
								onValueChange={(v) => setOfficer(v === "none" ? "" : v)}
							>
								<SelectTrigger id="fwd-officer" className="w-full">
									<SelectValue placeholder="Anyone in this office" />
								</SelectTrigger>
								<SelectContent className="max-h-72">
									<SelectItem value="none">Anyone in this office</SelectItem>
									{officers.map((u) => (
										<SelectItem key={u.id} value={u.id}>
											{[u.firstName, u.lastName].filter(Boolean).join(" ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
					<div className="space-y-1.5">
						<Label htmlFor="fwd-minute">Minute</Label>
						<Textarea
							id="fwd-minute"
							value={minute}
							onChange={(e) => setMinute(e.target.value)}
							rows={4}
							placeholder="What should the next office do?"
						/>
						<p className="text-xs text-muted-foreground">
							Required. Staff only.
						</p>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={busy || !chosen || sameOffice || tooShort}
						onClick={() =>
							chosen &&
							onForward({
								toOfficeId: chosen.id,
								toOfficeType: chosen.type,
								toOfficerId: officer || undefined,
								minute: minute.trim(),
							})
						}
					>
						{busy ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Forward className="h-4 w-4" />
						)}
						Forward
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** A required internal minute, used for Return. */
function MinuteDialog({
	open,
	onOpenChange,
	title,
	busy,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	busy?: boolean;
	onConfirm: (minute: string) => void;
}) {
	const [minute, setMinute] = useState("");
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
						It goes back to the office it came from. The company sees the
						office, not your minute.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-1.5">
					<Label htmlFor="ret-minute">Minute</Label>
					<Textarea
						id="ret-minute"
						value={minute}
						onChange={(e) => setMinute(e.target.value)}
						rows={4}
						placeholder="Why is it going back?"
					/>
					<p className="text-xs text-muted-foreground">Required. Staff only.</p>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						disabled={busy || minute.trim().length < MIN_MINUTE}
						onClick={() => onConfirm(minute.trim())}
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
		mayAct &&
		!!trail.data?.length &&
		(last === "forwarded" || last === "returned");
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
					<PermitTrail steps={steps} surface="staff" />
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
 * Timeline, Return and Forward for one row. Forward and Return appear only while the item is
 * open, the server says which office holds it, and that office is the user's (or the user is a
 * super admin).
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
	const [dialog, setDialog] = useState<
		"timeline" | "forward" | "return" | null
	>(null);
	const forward = useForwardItem(kind);
	const back = useReturnItem(kind);
	const mayAct =
		isOpen(kind, item.status) &&
		!!item.currentOffice &&
		(held ?? holdsItem(user, item));
	const close = (o: boolean) => !o && setDialog(null);
	return (
		<>
			<div className="flex flex-wrap gap-2">
				<Button size="sm" variant="ghost" onClick={() => setDialog("timeline")}>
					<History className="h-4 w-4" /> Timeline
				</Button>
				{mayAct && (
					<>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setDialog("return")}
						>
							<CornerUpLeft className="h-4 w-4" /> Return
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => setDialog("forward")}
						>
							<Forward className="h-4 w-4" /> Forward
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
				title={`Forward ${name}`}
				currentOfficeId={item.currentOfficeId}
				busy={forward.isPending}
				onForward={(input) =>
					forward.mutate(
						{ id: item.id, input },
						{ onSuccess: () => setDialog(null) },
					)
				}
			/>
			<MinuteDialog
				open={dialog === "return"}
				onOpenChange={close}
				title={`Return ${name}`}
				busy={back.isPending}
				onConfirm={(minute) =>
					back.mutate(
						{ id: item.id, minute },
						{ onSuccess: () => setDialog(null) },
					)
				}
			/>
		</>
	);
}
