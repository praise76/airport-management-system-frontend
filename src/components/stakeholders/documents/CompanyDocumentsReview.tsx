import {
	AlertCircle,
	Check,
	CheckCircle2,
	Eye,
	FileText,
	History,
	Loader2,
	MessageSquareWarning,
	X,
} from "lucide-react";
import { useId, useState } from "react";
import { ReasonDialog } from "@/components/stakeholders/ReviewActions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
	useDocumentChecklist,
	useOrgDocumentHistory,
	useReviewStakeholderDocument,
} from "@/hooks/stakeholder-documents";
import {
	describeExpiry,
	documentTypeLabel,
	formatFileSize,
} from "@/lib/stakeholder-documents";
import { canReviewStakeholders } from "@/lib/access";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type {
	ChecklistItem,
	ChecklistState,
	ComplianceDocument,
	DocumentDecision,
} from "@/types/stakeholder-documents";
import { DocumentStateBadge } from "./DocumentStateBadge";
import { useDocumentFileViewer } from "./useDocumentFileViewer";

const stateOf = (doc: ComplianceDocument): ChecklistState =>
	doc.effectiveStatus === "superseded" ? "pending_review" : doc.effectiveStatus;

/** Which decisions still make sense for a document in its current state. */
export function availableDecisions(
	doc: ComplianceDocument,
): DocumentDecision[] {
	if (doc.status === "superseded" || doc.effectiveStatus === "expired")
		return [];
	const out: DocumentDecision[] = [];
	if (doc.status !== "approved") out.push("approve");
	if (doc.status === "pending_review" || doc.status === "approved")
		out.push("request_info");
	if (doc.status !== "rejected") out.push("reject");
	return out;
}

function DecisionButtons({
	doc,
	busy,
	onDecide,
	size = "sm",
}: {
	doc: ComplianceDocument;
	busy: boolean;
	onDecide: (decision: DocumentDecision) => void;
	size?: "sm" | "default";
}) {
	const decisions = availableDecisions(doc);
	if (decisions.length === 0) return null;
	return (
		<div className="flex flex-wrap gap-2">
			{decisions.includes("approve") && (
				<Button
					size={size}
					disabled={busy}
					onClick={() => onDecide("approve")}
					className="gap-1"
				>
					<Check className="h-4 w-4" /> Approve
				</Button>
			)}
			{decisions.includes("request_info") && (
				<Button
					size={size}
					variant="outline"
					disabled={busy}
					onClick={() => onDecide("request_info")}
					className="gap-1"
				>
					<MessageSquareWarning className="h-4 w-4" /> Ask for more information
				</Button>
			)}
			{decisions.includes("reject") && (
				<Button
					size={size}
					variant="outline"
					disabled={busy}
					onClick={() => onDecide("reject")}
					className="gap-1 text-destructive hover:text-destructive"
				>
					<X className="h-4 w-4" /> Reject
				</Button>
			)}
		</div>
	);
}

/**
 * A company's compliance documents for FAAN: the required-documents checklist, each file opened
 * beside the approve / ask-for-more-information / reject buttons, and the upload history.
 */
export function CompanyDocumentsReview({ orgId }: { orgId: string }) {
	const user = useAuthStore((st) => st.user);
	const allowed = canReviewStakeholders(user);
	const { data, isLoading, isError, refetch } = useDocumentChecklist(allowed ? orgId : "");
	const review = useReviewStakeholderDocument(orgId);
	const historyId = useId();
	const [showHistory, setShowHistory] = useState(false);
	const history = useOrgDocumentHistory(orgId, showHistory);
	const [reasonFor, setReasonFor] = useState<{
		doc: ComplianceDocument;
		decision: Exclude<DocumentDecision, "approve">;
	} | null>(null);

	const decide = (doc: ComplianceDocument, decision: DocumentDecision) => {
		if (decision === "approve") {
			review.mutate(
				{ documentId: doc.id, decision },
				{ onSuccess: () => viewer.close() },
			);
		} else {
			setReasonFor({ doc, decision });
		}
	};

	const viewer = useDocumentFileViewer((doc) => (
		<div className="space-y-4 text-sm">
			<div className="space-y-2">
				<h4 className="font-semibold">
					{documentTypeLabel(doc.documentType, doc.title)}
				</h4>
				<DocumentStateBadge state={stateOf(doc)} />
			</div>
			<dl className="space-y-2">
				<div>
					<dt className="text-muted-foreground">File</dt>
					<dd className="font-medium break-all">
						{doc.originalName} ({formatFileSize(doc.fileSize)})
					</dd>
				</div>
				<div>
					<dt className="text-muted-foreground">Uploaded</dt>
					<dd>{new Date(doc.createdAt).toLocaleString("en-GB")}</dd>
				</div>
				{doc.issuedDate && (
					<div>
						<dt className="text-muted-foreground">Issued</dt>
						<dd>
							{new Date(`${doc.issuedDate}T00:00:00`).toLocaleDateString(
								"en-GB",
							)}
						</dd>
					</div>
				)}
				{describeExpiry(doc.expiryDate, doc.daysToExpiry) && (
					<div>
						<dt className="text-muted-foreground">Expiry</dt>
						<dd
							className={cn(
								doc.effectiveStatus === "expired" &&
									"text-destructive font-medium",
							)}
						>
							{describeExpiry(doc.expiryDate, doc.daysToExpiry)}
						</dd>
					</div>
				)}
				{doc.reviewComments && (
					<div>
						<dt className="text-muted-foreground">
							Last comment sent to the company
						</dt>
						<dd>{doc.reviewComments}</dd>
					</div>
				)}
			</dl>
			<DecisionButtons
				doc={doc}
				busy={review.isPending}
				onDecide={(d) => decide(doc, d)}
				size="sm"
			/>
		</div>
	));

	if (!allowed) {
		return (
			<div className="py-12 text-center space-y-2">
				<FileText className="h-10 w-10 mx-auto text-muted-foreground" />
				<p className="font-medium">Documents are visible to FAAN's stakeholder reviewers only.</p>
				<p className="text-sm text-muted-foreground">Ask an administrator to give you reviewer access if you need it.</p>
			</div>
		);
	}
	if (isLoading) {
		return (
			<div className="py-12 text-center">
				<Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
			</div>
		);
	}
	if (isError || !data) {
		return (
			<div className="py-12 text-center space-y-3">
				<AlertCircle className="h-10 w-10 mx-auto text-destructive" />
				<p className="text-muted-foreground">
					The documents could not be loaded.
				</p>
				<Button variant="outline" onClick={() => refetch()}>
					Try again
				</Button>
			</div>
		);
	}

	const missing = data.items.filter((i) => i.state !== "approved");

	return (
		<div className="space-y-6">
			<div
				className={cn(
					"flex items-center gap-3 rounded-lg border p-4 text-sm",
					data.ready
						? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
						: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
				)}
			>
				{data.ready ? (
					<CheckCircle2 className="h-5 w-5 shrink-0" />
				) : (
					<AlertCircle className="h-5 w-5 shrink-0" />
				)}
				<p>
					{data.items.length === 0
						? "This type of organisation has no required documents."
						: data.ready
							? "All required documents are approved and in date."
							: `${missing.length} of ${data.items.length} required document${data.items.length === 1 ? " is" : "s are"} not approved yet.`}
				</p>
			</div>

			<div className="space-y-3">
				{data.items.map((item) => (
					<StaffRow
						key={item.documentType}
						item={item}
						busy={review.isPending}
						viewing={viewer.loadingId === item.document?.id}
						onView={() => item.document && viewer.open(item.document)}
						onDecide={decide}
					/>
				))}
			</div>

			{data.additional.length > 0 && (
				<div className="space-y-3">
					<h3 className="font-semibold">Other documents</h3>
					{data.additional.map((doc) => (
						<StaffDocRow
							key={doc.id}
							doc={doc}
							busy={review.isPending}
							viewing={viewer.loadingId === doc.id}
							onView={() => viewer.open(doc)}
							onDecide={decide}
						/>
					))}
				</div>
			)}

			<div className="border-t pt-4 space-y-3">
				<div className="flex items-center gap-3 text-sm w-fit">
					<Switch
						id={historyId}
						checked={showHistory}
						onCheckedChange={setShowHistory}
					/>
					<Label
						htmlFor={historyId}
						className="flex items-center gap-2 cursor-pointer font-normal"
					>
						<History className="h-4 w-4 text-muted-foreground" /> Show earlier
						versions
					</Label>
				</div>
				{showHistory &&
					(history.isLoading ? (
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					) : (
						<div className="space-y-2">
							{(history.data ?? []).filter((d) => d.status === "superseded")
								.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No earlier versions.
								</p>
							)}
							{(history.data ?? [])
								.filter((d) => d.status === "superseded")
								.map((doc) => (
									<div
										key={doc.id}
										className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
									>
										<div className="min-w-0">
											<p className="font-medium">
												{documentTypeLabel(doc.documentType, doc.title)}
											</p>
											<p className="text-muted-foreground truncate">
												{doc.originalName} · uploaded{" "}
												{new Date(doc.createdAt).toLocaleDateString("en-GB")} ·
												replaced
											</p>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => viewer.open(doc)}
											disabled={viewer.loadingId === doc.id}
										>
											<Eye className="h-4 w-4 mr-1" /> View
										</Button>
									</div>
								))}
						</div>
					))}
			</div>

			<ReasonDialog
				open={!!reasonFor}
				onOpenChange={(o) => !o && setReasonFor(null)}
				title={
					reasonFor?.decision === "reject"
						? "Reject this document"
						: "Ask for more information"
				}
				description={
					reasonFor
						? `${documentTypeLabel(reasonFor.doc.documentType, reasonFor.doc.title)}. The company is emailed this message and sees it in their portal.`
						: undefined
				}
				confirmLabel={
					reasonFor?.decision === "reject" ? "Reject document" : "Send request"
				}
				busy={review.isPending}
				onConfirm={(reason) => {
					if (!reasonFor) return;
					review.mutate(
						{
							documentId: reasonFor.doc.id,
							decision: reasonFor.decision,
							comments: reason,
						},
						{
							onSuccess: () => {
								setReasonFor(null);
								viewer.close();
							},
						},
					);
				}}
			/>
			{viewer.viewer}
		</div>
	);
}

function StaffRow({
	item,
	busy,
	viewing,
	onView,
	onDecide,
}: {
	item: ChecklistItem;
	busy: boolean;
	viewing: boolean;
	onView: () => void;
	onDecide: (doc: ComplianceDocument, d: DocumentDecision) => void;
}) {
	const doc = item.document;
	const expiry = doc ? describeExpiry(doc.expiryDate, item.daysToExpiry) : null;
	return (
		<div className="rounded-lg border p-4 space-y-3">
			<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-3 flex-wrap">
						<h3 className="font-medium">
							{documentTypeLabel(item.documentType)}
						</h3>
						<DocumentStateBadge state={item.state} />
					</div>
					{doc ? (
						<p className="text-sm text-muted-foreground mt-1 truncate">
							{doc.originalName} · {formatFileSize(doc.fileSize)} · uploaded{" "}
							{new Date(doc.createdAt).toLocaleDateString("en-GB")}
						</p>
					) : (
						<p className="text-sm text-muted-foreground mt-1">
							The company has not uploaded this yet.
						</p>
					)}
					{expiry && (
						<p
							className={cn(
								"text-sm mt-0.5",
								item.state === "expired"
									? "text-destructive"
									: item.expiringSoon
										? "text-amber-600 dark:text-amber-400"
										: "text-muted-foreground",
							)}
						>
							{expiry}
						</p>
					)}
				</div>
				{doc && (
					<Button
						variant="outline"
						size="sm"
						onClick={onView}
						disabled={viewing}
						className="shrink-0"
					>
						{viewing ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Eye className="h-4 w-4 mr-1" />
						)}
						Open
					</Button>
				)}
			</div>
			{doc?.reviewComments && (
				<p className="text-sm rounded-md bg-muted p-3">
					<span className="text-muted-foreground">
						Comment sent to the company:{" "}
					</span>
					{doc.reviewComments}
				</p>
			)}
			{doc && (
				<DecisionButtons
					doc={doc}
					busy={busy}
					onDecide={(d) => onDecide(doc, d)}
				/>
			)}
		</div>
	);
}

function StaffDocRow({
	doc,
	busy,
	viewing,
	onView,
	onDecide,
}: {
	doc: ComplianceDocument;
	busy: boolean;
	viewing: boolean;
	onView: () => void;
	onDecide: (doc: ComplianceDocument, d: DocumentDecision) => void;
}) {
	return (
		<div className="rounded-lg border p-4 space-y-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-3 flex-wrap">
						<FileText className="h-4 w-4 text-muted-foreground" />
						<h3 className="font-medium">
							{documentTypeLabel(doc.documentType, doc.title)}
						</h3>
						<DocumentStateBadge state={stateOf(doc)} />
					</div>
					<p className="text-sm text-muted-foreground mt-1 truncate">
						{doc.originalName}
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={onView}
					disabled={viewing}
					className="shrink-0"
				>
					{viewing ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<Eye className="h-4 w-4 mr-1" />
					)}
					Open
				</Button>
			</div>
			<DecisionButtons
				doc={doc}
				busy={busy}
				onDecide={(d) => onDecide(doc, d)}
			/>
		</div>
	);
}
