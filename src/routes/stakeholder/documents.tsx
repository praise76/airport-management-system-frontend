import { createFileRoute, Link } from "@tanstack/react-router";
import {
	AlertCircle,
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Eye,
	FileText,
	FileUp,
	Loader2,
	Plus,
} from "lucide-react";
import { useState } from "react";
import { DocumentStateBadge } from "@/components/stakeholders/documents/DocumentStateBadge";
import { UploadDocumentDialog } from "@/components/stakeholders/documents/UploadDocumentDialog";
import { useDocumentFileViewer } from "@/components/stakeholders/documents/useDocumentFileViewer";
import { Button } from "@/components/ui/button";
import { useDocumentChecklist } from "@/hooks/stakeholder-documents";
import {
	describeExpiry,
	documentTypeLabel,
	formatFileSize,
} from "@/lib/stakeholder-documents";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import type {
	ChecklistItem,
	ComplianceDocument,
	ComplianceDocumentType,
} from "@/types/stakeholder-documents";

export const Route = createFileRoute("/stakeholder/documents")({
	component: DocumentsPage,
});

function DocumentsPage() {
	const { user } = useAuthStore();
	const orgId = user?.organizationId || "";
	const { data, isLoading, isError, refetch } = useDocumentChecklist(orgId);
	const [uploading, setUploading] = useState<{
		type: ComplianceDocumentType;
		replacing: boolean;
	} | null>(null);

	const viewer = useDocumentFileViewer((doc) => (
		<div className="space-y-3 text-sm">
			<h4 className="font-semibold">
				{documentTypeLabel(doc.documentType, doc.title)}
			</h4>
			<DocumentStateBadge
				state={
					doc.effectiveStatus === "superseded"
						? "pending_review"
						: doc.effectiveStatus
				}
			/>
			{describeExpiry(doc.expiryDate, doc.daysToExpiry) && (
				<p className="text-muted-foreground">
					{describeExpiry(doc.expiryDate, doc.daysToExpiry)}
				</p>
			)}
			{doc.reviewComments && (
				<div>
					<p className="text-muted-foreground">FAAN's comment</p>
					<p>{doc.reviewComments}</p>
				</div>
			)}
		</div>
	));

	const needsAttention = (data?.items ?? []).filter(
		(i) => i.state !== "approved" && i.state !== "pending_review",
	);
	const expiringSoon = (data?.items ?? []).filter((i) => i.expiringSoon);

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
			<div className="max-w-4xl mx-auto space-y-6">
				<div>
					<Link to="/stakeholder/dashboard">
						<Button
							variant="ghost"
							size="sm"
							className="text-slate-400 hover:text-white -ml-2"
						>
							<ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
						</Button>
					</Link>
					<h1 className="text-3xl font-bold text-white flex items-center gap-3 mt-2">
						<FileText className="h-8 w-8 text-blue-400" />
						Documents
					</h1>
					<p className="text-slate-400 mt-1">
						FAAN needs these on file before your company can be verified. We
						email you 30 days before any of them expire.
					</p>
				</div>

				{isLoading ? (
					<div className="bg-white/5 rounded-xl p-12 text-center">
						<Loader2 className="h-8 w-8 text-blue-400 mx-auto animate-spin" />
					</div>
				) : isError || !data ? (
					<div className="bg-white/5 rounded-xl p-12 text-center space-y-3">
						<AlertCircle className="h-10 w-10 text-red-400 mx-auto" />
						<p className="text-slate-300">We couldn't load your documents.</p>
						<Button
							variant="outline"
							onClick={() => refetch()}
							className="bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white"
						>
							Try again
						</Button>
					</div>
				) : (
					<>
						<StatusBanner
							ready={data.ready}
							attention={needsAttention.length}
							expiringSoon={expiringSoon.length}
							total={data.items.length}
						/>

						<div className="space-y-3">
							{data.items.map((item) => (
								<RequiredRow
									key={item.documentType}
									item={item}
									viewing={viewer.loadingId === item.document?.id}
									onView={() => item.document && viewer.open(item.document)}
									onUpload={() =>
										setUploading({
											type: item.documentType,
											replacing: !!item.document,
										})
									}
								/>
							))}
							{data.items.length === 0 && (
								<p className="text-slate-400 text-sm">
									Your organisation type has no required documents. You can
									still add any you wish to keep on file.
								</p>
							)}
						</div>

						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold text-white">
									Other documents
								</h2>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setUploading({ type: "other", replacing: false })
									}
									className="bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white"
								>
									<Plus className="h-4 w-4 mr-1" /> Add a document
								</Button>
							</div>
							{data.additional.length === 0 ? (
								<p className="text-slate-400 text-sm">Nothing else on file.</p>
							) : (
								data.additional.map((doc) => (
									<AdditionalRow
										key={doc.id}
										doc={doc}
										viewing={viewer.loadingId === doc.id}
										onView={() => viewer.open(doc)}
									/>
								))
							)}
						</div>
					</>
				)}
			</div>

			{uploading && (
				<UploadDocumentDialog
					key={uploading.type}
					orgId={orgId}
					documentType={uploading.type}
					replacing={uploading.replacing}
					open
					onOpenChange={(o) => !o && setUploading(null)}
				/>
			)}
			{viewer.viewer}
		</div>
	);
}

function StatusBanner({
	ready,
	attention,
	expiringSoon,
	total,
}: {
	ready: boolean;
	attention: number;
	expiringSoon: number;
	total: number;
}) {
	if (ready && expiringSoon === 0) {
		return (
			<div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
				<CheckCircle2 className="h-5 w-5 shrink-0" />
				<p>
					{total === 0
						? "No documents are required."
						: "All required documents are approved."}
				</p>
			</div>
		);
	}
	const parts: string[] = [];
	if (attention > 0)
		parts.push(
			`${attention} document${attention === 1 ? " needs" : "s need"} your attention`,
		);
	if (expiringSoon > 0)
		parts.push(
			`${expiringSoon} expire${expiringSoon === 1 ? "s" : ""} within 30 days`,
		);
	return (
		<div
			className={cn(
				"flex items-center gap-3 rounded-xl border p-4",
				attention > 0 || expiringSoon > 0
					? "border-amber-500/30 bg-amber-500/10 text-amber-200"
					: "border-blue-500/30 bg-blue-500/10 text-blue-200",
			)}
		>
			<AlertTriangle className="h-5 w-5 shrink-0" />
			<p>
				{parts.length > 0
					? `${parts.join(". ")}.`
					: "Your documents are with FAAN for review."}
			</p>
		</div>
	);
}

function expiryTone(item: { state: string; expiringSoon: boolean }) {
	if (item.state === "expired") return "text-red-300";
	if (item.expiringSoon) return "text-amber-300";
	return "text-slate-400";
}

function RequiredRow({
	item,
	viewing,
	onView,
	onUpload,
}: {
	item: ChecklistItem;
	viewing: boolean;
	onView: () => void;
	onUpload: () => void;
}) {
	const doc = item.document;
	const expiry = doc ? describeExpiry(doc.expiryDate, item.daysToExpiry) : null;
	// Missing, expired, or sent back by FAAN: the company has to act, so the upload button leads.
	const mustAct = [
		"missing",
		"expired",
		"more_info_requested",
		"rejected",
	].includes(item.state);

	return (
		<div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 space-y-3">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
				<div className="min-w-0">
					<div className="flex items-center gap-3 flex-wrap">
						<h3 className="text-white font-medium">
							{documentTypeLabel(item.documentType)}
						</h3>
						<DocumentStateBadge state={item.state} surface="portal" />
					</div>
					{doc && (
						<p className="text-sm text-slate-400 mt-1 truncate">
							{doc.originalName} · {formatFileSize(doc.fileSize)} · uploaded{" "}
							{new Date(doc.createdAt).toLocaleDateString("en-GB", {
								day: "numeric",
								month: "short",
								year: "numeric",
							})}
						</p>
					)}
					{expiry && (
						<p className={cn("text-sm mt-0.5", expiryTone(item))}>{expiry}</p>
					)}
				</div>
				<div className="flex gap-2 shrink-0">
					{doc && (
						<Button
							variant="outline"
							size="sm"
							onClick={onView}
							disabled={viewing}
							className="bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white"
						>
							{viewing ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<Eye className="h-4 w-4 mr-1" />
							)}
							View
						</Button>
					)}
					<Button
						size="sm"
						onClick={onUpload}
						variant={mustAct ? "default" : "outline"}
						className={
							mustAct
								? "bg-blue-600 hover:bg-blue-500"
								: "bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white"
						}
					>
						<FileUp className="h-4 w-4 mr-1" />
						{doc ? "Replace" : "Upload"}
					</Button>
				</div>
			</div>

			{doc?.reviewComments &&
				(item.state === "more_info_requested" || item.state === "rejected") && (
					<div
						className={cn(
							"rounded-lg border p-3 text-sm",
							item.state === "rejected"
								? "border-red-500/30 bg-red-500/10 text-red-100"
								: "border-amber-500/30 bg-amber-500/10 text-amber-100",
						)}
					>
						<p className="font-medium mb-0.5">
							{item.state === "rejected"
								? "FAAN rejected this document"
								: "FAAN needs more information"}
						</p>
						<p>{doc.reviewComments}</p>
					</div>
				)}
		</div>
	);
}

function AdditionalRow({
	doc,
	viewing,
	onView,
}: {
	doc: ComplianceDocument;
	viewing: boolean;
	onView: () => void;
}) {
	const state =
		doc.effectiveStatus === "superseded"
			? "pending_review"
			: doc.effectiveStatus;
	return (
		<div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-3">
			<div className="min-w-0">
				<div className="flex items-center gap-3 flex-wrap">
					<h3 className="text-white font-medium">
						{documentTypeLabel(doc.documentType, doc.title)}
					</h3>
					<DocumentStateBadge state={state} surface="portal" />
				</div>
				<p className="text-sm text-slate-400 truncate">{doc.originalName}</p>
				{doc.reviewComments && (
					<p className="text-sm text-slate-300 mt-1">{doc.reviewComments}</p>
				)}
			</div>
			<Button
				variant="outline"
				size="sm"
				onClick={onView}
				disabled={viewing}
				className="bg-transparent border-slate-600 text-slate-200 hover:bg-white/10 hover:text-white shrink-0"
			>
				{viewing ? (
					<Loader2 className="h-4 w-4 animate-spin" />
				) : (
					<Eye className="h-4 w-4 mr-1" />
				)}
				View
			</Button>
		</div>
	);
}
