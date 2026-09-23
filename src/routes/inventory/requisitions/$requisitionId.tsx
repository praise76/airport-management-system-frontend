import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Timeline, type TimelineEvent } from "@/components/ui/timeline";
import { SignatureList } from "@/features/signatures/SignatureList";
import { SignaturePad } from "@/features/signatures/SignaturePad";
import {
	useCancelRequisition,
	useDecideRequisition,
	useIssueRequisitionLine,
	useItems,
	useRequisition,
	useRequisitionApprovals,
} from "@/hooks/inventory";
import { useCaptureSignature } from "@/hooks/signatures";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuthStore } from "@/stores/auth";
import { REQUISITION_STATUS_LABELS } from "@/types/inventory";
import type { SignatureType } from "@/types/signatures";
import { getAccessToken } from "@/utils/auth";

export const Route = createFileRoute("/inventory/requisitions/$requisitionId")({
	beforeLoad: () => {
		const token = getAccessToken();
		if (!token && typeof window !== "undefined")
			throw redirect({ to: "/auth/login" });
	},
	component: RequisitionDetailPage,
});

const CANCELLABLE_STATUSES = new Set([
	"draft",
	"submitted",
	"pending_manager_approval",
	"pending_hod_approval",
	"pending_director_approval",
	"pending_ceo_approval",
	"partially_issued",
]);

const ISSUABLE_STATUSES = new Set(["approved", "issuing", "partially_issued"]);

function RequisitionDetailPage() {
	const { requisitionId } = Route.useParams();
	const user = useAuthStore((s) => s.user);
	const { hasPermission } = usePermissions();

	const { data: requisition, isLoading } = useRequisition(requisitionId);
	const { data: approvals } = useRequisitionApprovals(requisitionId);
	const { data: items } = useItems();

	const decide = useDecideRequisition();
	const issueLine = useIssueRequisitionLine();
	const cancel = useCancelRequisition();
	const captureSignature = useCaptureSignature();

	const [comments, setComments] = useState("");
	const [signature, setSignature] = useState<{
		signatureType: SignatureType;
		signatureData: string;
	} | null>(null);
	const [issueQuantities, setIssueQuantities] = useState<
		Record<string, number>
	>({});
	const [cancelOpen, setCancelOpen] = useState(false);

	if (isLoading || !requisition) {
		return (
			<div className="p-6 text-muted-foreground">Loading requisition...</div>
		);
	}

	const itemById = new Map((items ?? []).map((i) => [i.id, i]));
	const isCurrentApprover =
		!!user?.userId && requisition.currentApproverUserId === user.userId;
	const canDecide = isCurrentApprover && hasPermission("inventory.approve");
	const canIssue =
		hasPermission("inventory.issue") &&
		ISSUABLE_STATUSES.has(requisition.status);
	const canCancel =
		CANCELLABLE_STATUSES.has(requisition.status) &&
		(requisition.requestedByUserId === user?.userId ||
			hasPermission("inventory.manage"));

	async function handleDecide(decision: "approved" | "rejected") {
		if (signature) {
			await captureSignature.mutateAsync({
				relatedEntityType: "requisition",
				relatedEntityId: requisitionId,
				intent: decision,
				signatureType: signature.signatureType,
				signatureData: signature.signatureData,
				reason: comments || undefined,
			});
		}
		await decide.mutateAsync({
			id: requisitionId,
			input: { decision, comments: comments || undefined },
		});
		setComments("");
		setSignature(null);
	}

	async function handleIssue(lineItemId: string) {
		const quantityToIssue = issueQuantities[lineItemId];
		if (!quantityToIssue || quantityToIssue <= 0) return;
		await issueLine.mutateAsync({
			id: requisitionId,
			input: { lineItemId, quantityToIssue },
		});
		if (signature) {
			await captureSignature.mutateAsync({
				relatedEntityType: "requisition",
				relatedEntityId: requisitionId,
				intent: "issued",
				signatureType: signature.signatureType,
				signatureData: signature.signatureData,
			});
		}
		setIssueQuantities((prev) => ({ ...prev, [lineItemId]: 0 }));
	}

	const timelineEvents: TimelineEvent[] = (approvals ?? []).map((a) => ({
		id: a.id,
		title:
			a.decision === "approved"
				? "Approved"
				: a.decision === "rejected"
					? "Rejected"
					: "Escalated to next level",
		description: a.comments ?? `${a.fromStatus} → ${a.toStatus}`,
		timestamp: a.createdAt,
		status:
			a.decision === "approved"
				? "completed"
				: a.decision === "rejected"
					? "rejected"
					: "current",
	}));

	return (
		<div className="p-6 max-w-4xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link
						to="/inventory/requisitions"
						className="text-sm text-primary hover:underline"
					>
						← Back to Requisitions
					</Link>
					<h1 className="text-2xl font-semibold font-mono">
						{requisition.requisitionNumber}
					</h1>
				</div>
				<Badge className="text-sm">
					{REQUISITION_STATUS_LABELS[requisition.status]}
				</Badge>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Details</CardTitle>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-4 text-sm">
					<div>
						<p className="text-muted-foreground">Estimated Value</p>
						<p className="font-medium">
							₦{Number(requisition.totalEstimatedValue).toLocaleString()}
						</p>
					</div>
					<div>
						<p className="text-muted-foreground">Justification</p>
						<p className="font-medium">{requisition.justification ?? "-"}</p>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Line Items</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Item</TableHead>
								<TableHead>Requested</TableHead>
								<TableHead>Issued</TableHead>
								<TableHead>Value</TableHead>
								{canIssue && <TableHead>Issue Action</TableHead>}
							</TableRow>
						</TableHeader>
						<TableBody>
							{requisition.lineItems.map((line) => {
								const item = itemById.get(line.itemId);
								const remaining = line.quantityRequested - line.quantityIssued;
								return (
									<TableRow key={line.id}>
										<TableCell>{item?.name ?? line.itemId}</TableCell>
										<TableCell>{line.quantityRequested}</TableCell>
										<TableCell>{line.quantityIssued}</TableCell>
										<TableCell>
											₦{Number(line.lineEstimatedValue).toLocaleString()}
										</TableCell>
										{canIssue && (
											<TableCell>
												{remaining > 0 ? (
													<div className="flex items-center gap-2">
														<Input
															type="number"
															min={1}
															max={remaining}
															className="w-20"
															value={issueQuantities[line.id] ?? ""}
															onChange={(e) =>
																setIssueQuantities((prev) => ({
																	...prev,
																	[line.id]: Number(e.target.value),
																}))
															}
														/>
														<Button
															size="sm"
															onClick={() => handleIssue(line.id)}
															disabled={issueLine.isPending}
														>
															Issue
														</Button>
													</div>
												) : (
													<span className="text-xs text-muted-foreground">
														Fully issued
													</span>
												)}
											</TableCell>
										)}
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{canDecide && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Your Decision</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="decisionComments">Comments</Label>
							<Textarea
								id="decisionComments"
								value={comments}
								onChange={(e) => setComments(e.target.value)}
							/>
						</div>
						<div>
							<Label>Signature (optional)</Label>
							<SignaturePad onChange={setSignature} />
						</div>
						<div className="flex gap-2 justify-end">
							<Button
								variant="destructive"
								onClick={() => handleDecide("rejected")}
								disabled={decide.isPending}
							>
								Reject
							</Button>
							<Button
								onClick={() => handleDecide("approved")}
								disabled={decide.isPending}
							>
								Approve
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{timelineEvents.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Approval History</CardTitle>
					</CardHeader>
					<CardContent>
						<Timeline events={timelineEvents} />
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Signatures</CardTitle>
				</CardHeader>
				<CardContent>
					<SignatureList
						relatedEntityType="requisition"
						relatedEntityId={requisitionId}
					/>
				</CardContent>
			</Card>

			{canCancel && (
				<div className="flex justify-end">
					<Button
						variant="outline"
						className="text-destructive"
						onClick={() => setCancelOpen(true)}
					>
						Cancel Requisition
					</Button>
				</div>
			)}

			<ConfirmDialog
				open={cancelOpen}
				onOpenChange={setCancelOpen}
				title="Cancel requisition?"
				description="Any reserved stock for unissued lines will be released."
				confirmLabel="Cancel Requisition"
				variant="destructive"
				loading={cancel.isPending}
				onConfirm={() => {
					cancel.mutate({ id: requisitionId });
					setCancelOpen(false);
				}}
			/>
		</div>
	);
}
