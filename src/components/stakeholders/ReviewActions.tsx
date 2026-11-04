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
	useReviewStakeholderInvoice,
	useStakeholderInvoices,
} from "@/hooks/stakeholder-portal";
import { formatNaira } from "@/lib/labels";
import type { StakeholderInvoice } from "@/types/stakeholder-portal";

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
}: {
	onApprove: () => void;
	onReject: (reason: string) => void;
	busy?: boolean;
	approveLabel?: string;
	rejectLabel?: string;
	rejectTitle: string;
	size?: "sm" | "default";
}) {
	const [rejecting, setRejecting] = useState(false);
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
					</div>
					<div className="flex items-center gap-4">
						<span className="font-semibold">{formatNaira(inv.total)}</span>
						{REVIEWABLE.has(inv.status) && (
							<DecisionButtons
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
