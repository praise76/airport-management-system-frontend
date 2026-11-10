import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { StatusPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import {
	useReviewStakeholderActivity,
	useReviewStakeholderInvoice,
	useStakeholderInvoices,
} from "@/hooks/stakeholder-portal";
import { canReviewStakeholders } from "@/lib/access";
import { formatNaira } from "@/lib/labels";
import { holdsItem } from "@/lib/routing";
import { useAuthStore } from "@/stores/auth";
import { type RequestLetter, requestLetterOf } from "@/api/stakeholder-portal";
import { CurrentlyWith } from "./PermitTrail";
import { RequestLetterButton } from "./RequestLetter";
import { RoutingButtons } from "./RoutingActions";
import type { RoutingFields, StakeholderActivity, StakeholderInvoice } from "@/types/stakeholder-portal";

/** Asks for a reason before a "no" decision. The reason is sent to the company. */
export function ReasonDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	onConfirm,
	busy,
	required = true,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	confirmLabel: string;
	onConfirm: (reason: string) => void;
	busy?: boolean;
	required?: boolean;
}) {
	const [reason, setReason] = useState("");
	const tooShort = required && reason.trim().length < 5;
	return (
		<Dialog
			open={open}
			onOpenChange={(o) => {
				if (!o) setReason("");
				onOpenChange(o);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <DialogDescription>{description}</DialogDescription>}
				</DialogHeader>
				<Textarea
					value={reason}
					onChange={(e) => setReason(e.target.value)}
					placeholder={required ? "Reason (the applicant will see this)" : "Comments (optional)"}
					rows={4}
				/>
				{required && (
					<p className="text-xs text-muted-foreground">At least 5 characters.</p>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant={required ? "destructive" : "default"}
						disabled={busy || tooShort}
						onClick={() => onConfirm(reason.trim())}
					>
						{busy && <Loader2 className="h-4 w-4 animate-spin" />}
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/** Approve and Reject buttons for something waiting on a decision. */
export function DecisionButtons({
	onApprove,
	onReject,
	busy,
	approveLabel = "Approve",
	rejectLabel = "Reject",
	rejectTitle,
	size = "sm",
	item,
	held,
}: {
	/** True when the server has already said the user's office holds the item. */
	held?: boolean;
	/** With office routing: only the office that holds the item (or a super admin) decides. */
	item?: RoutingFields;
	onApprove: () => void;
	onReject: (reason: string) => void;
	busy?: boolean;
	approveLabel?: string;
	rejectLabel?: string;
	rejectTitle: string;
	size?: "sm" | "default";
}) {
	const [rejecting, setRejecting] = useState(false);
	const user = useAuthStore((st) => st.user);
	// Only named reviewers can decide; the server refuses everyone else, so don't offer the buttons.
	const routed = !!item && (!!item.currentOfficeId || !!item.currentOfficerId);
	if (held === undefined && (routed ? !holdsItem(user, item) : !canReviewStakeholders(user))) return null;
	if (held === false) return null;
	return (
		<>
			<div className="flex gap-2">
				<Button size={size} variant="outline" onClick={() => setRejecting(true)} disabled={busy}>
					<X className="h-4 w-4" /> {rejectLabel}
				</Button>
				<Button size={size} onClick={onApprove} disabled={busy}>
					{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
					{approveLabel}
				</Button>
			</div>
			<ReasonDialog
				open={rejecting}
				onOpenChange={setRejecting}
				title={rejectTitle}
				confirmLabel={rejectLabel}
				busy={busy}
				onConfirm={(reason) => {
					onReject(reason);
					setRejecting(false);
				}}
			/>
		</>
	);
}

const REVIEWABLE = new Set(["submitted", "under_review"]);

/** Partner activities submitted to FAAN, with reviewer approve/reject actions. */
export function ActivitiesReviewTab({
	stakeholderOrgId,
	activities,
}: {
	stakeholderOrgId: string;
	activities: StakeholderActivity[];
}) {
	const review = useReviewStakeholderActivity(stakeholderOrgId);

	if (activities.length === 0)
		return (
			<p className="py-12 text-center text-muted-foreground">
				No activities recorded for this stakeholder.
			</p>
		);

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-3">
				<h3 className="font-semibold">Recent Activities</h3>
				<span className="text-sm text-muted-foreground">
					{activities.filter((activity) => REVIEWABLE.has(activity.status)).length} waiting for a decision
				</span>
			</div>
			<div className="divide-y rounded-lg border">
				{activities.map((activity) => (
					<div key={activity.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<p className="font-medium">{activity.activityTitle}</p>
								<StatusPill status={activity.status} />
							</div>
							<p className="text-sm text-muted-foreground">
								{activity.activityType} · {activity.activityReference}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Submitted {new Date(activity.submittedAt ?? activity.createdAt).toLocaleString()}
								{activity.reviewComments && ` · Review note: ${activity.reviewComments}`}
							</p>
							{REVIEWABLE.has(activity.status) && <CurrentlyWith item={activity} surface="staff" className="mt-1" />}
						</div>
						<div className="flex flex-wrap items-center gap-2">
						{requestLetterOf(activity) && (
							<RequestLetterButton letter={requestLetterOf(activity) as RequestLetter} surface="staff" />
						)}
						<RoutingButtons kind="activities" item={activity} name={activity.activityReference || activity.activityTitle} />
						{REVIEWABLE.has(activity.status) && (
							<DecisionButtons
								item={activity}
								busy={review.isPending && review.variables?.activityId === activity.id}
								rejectTitle={`Reject activity ${activity.activityReference || activity.activityTitle}?`}
								onApprove={() =>
									review.mutate({ activityId: activity.id, status: "approved" })
								}
								onReject={(reason) =>
									review.mutate({
										activityId: activity.id,
										status: "rejected",
										reviewComments: reason,
									})
								}
							/>
						)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

/** Invoices a company has sent to FAAN, with approve/reject for ones awaiting review. */
export function InvoicesReviewTab({ stakeholderOrgId }: { stakeholderOrgId: string }) {
	const { data, isLoading } = useStakeholderInvoices(stakeholderOrgId, { limit: 50 });
	const review = useReviewStakeholderInvoice(stakeholderOrgId);
	const invoices: StakeholderInvoice[] = (data as any)?.data ?? (data as any)?.items ?? [];

	if (isLoading) return <p className="py-12 text-center text-muted-foreground">Loading invoices…</p>;
	if (invoices.length === 0)
		return (
			<p className="py-12 text-center text-muted-foreground">
				This company hasn't sent any invoices.
			</p>
		);

	return (
		<div className="border rounded-lg divide-y">
			{invoices.map((inv) => (
				<div key={inv.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-medium">{inv.invoiceNumber}</span>
							<StatusPill status={inv.status} />
						</div>
						<p className="text-sm text-muted-foreground truncate">{inv.description}</p>
						<p className="text-xs text-muted-foreground mt-1">
							Dated {new Date(inv.invoiceDate).toLocaleDateString("en-GB")} · due{" "}
							{new Date(inv.dueDate).toLocaleDateString("en-GB")}
							{inv.reviewComments && ` · Review note: ${inv.reviewComments}`}
						</p>
						{REVIEWABLE.has(inv.status) && <CurrentlyWith item={inv} surface="staff" className="mt-1" />}
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<span className="font-semibold">{formatNaira(inv.total)}</span>
						<RoutingButtons kind="invoices" item={inv} name={`invoice ${inv.invoiceNumber}`} />
						{REVIEWABLE.has(inv.status) && (
							<DecisionButtons
								item={inv}
								busy={review.isPending && review.variables?.invoiceId === inv.id}
								rejectTitle={`Reject invoice ${inv.invoiceNumber}?`}
								onApprove={() => review.mutate({ invoiceId: inv.id, reviewStatus: "approved" })}
								onReject={(reason) =>
									review.mutate({
										invoiceId: inv.id,
										reviewStatus: "rejected",
										reviewComments: reason,
									})
								}
							/>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
