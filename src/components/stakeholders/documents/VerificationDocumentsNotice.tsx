import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDocumentChecklist } from "@/hooks/stakeholder-documents";
import { STATE_LABELS, documentTypeLabel } from "@/lib/stakeholder-documents";
import { cn } from "@/lib/utils";

/** Shown in the Verify dialog so FAAN sees which required documents are still outstanding. */
export function VerificationDocumentsNotice({
	orgId,
	onOpenDocuments,
}: {
	orgId: string;
	onOpenDocuments: () => void;
}) {
	const { data, isLoading } = useDocumentChecklist(orgId);
	if (isLoading)
		return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
	if (!data) return null;

	const outstanding = data.items.filter((i) => i.state !== "approved");
	if (outstanding.length === 0) {
		return (
			<div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
				<CheckCircle2 className="h-4 w-4 shrink-0" />
				{data.items.length === 0
					? "No documents are required for this organisation type."
					: "All required documents are approved."}
			</div>
		);
	}
	return (
		<div
			className={cn(
				"space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200",
			)}
		>
			<p className="flex items-center gap-2 font-medium">
				<AlertCircle className="h-4 w-4 shrink-0" /> Required documents not
				approved yet
			</p>
			<ul className="list-disc pl-6">
				{outstanding.map((i) => (
					<li key={i.documentType}>
						{documentTypeLabel(i.documentType)}:{" "}
						{STATE_LABELS[i.state].toLowerCase()}
					</li>
				))}
			</ul>
			<Button variant="outline" size="sm" onClick={onOpenDocuments}>
				Review documents
			</Button>
		</div>
	);
}
