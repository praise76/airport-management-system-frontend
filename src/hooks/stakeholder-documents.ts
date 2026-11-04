import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as DocumentsApi from "@/api/stakeholder-documents";
import { errorMessage } from "@/lib/stakeholder-documents";
import type {
	DocumentDecision,
	DocumentQueueParams,
	UploadDocumentInput,
} from "@/types/stakeholder-documents";

// Everything about a company's documents lives under this key, so one invalidation refreshes
// the checklist, the list and the history together.
const orgDocsKey = (orgId: string) =>
	["stakeholder-orgs", orgId, "documents"] as const;

export function useDocumentChecklist(orgId: string) {
	return useQuery({
		queryKey: [...orgDocsKey(orgId), "checklist"],
		queryFn: () => DocumentsApi.getDocumentChecklist(orgId),
		enabled: !!orgId,
	});
}

export function useOrgDocumentHistory(orgId: string, enabled: boolean) {
	return useQuery({
		queryKey: [...orgDocsKey(orgId), "history"],
		queryFn: () => DocumentsApi.listOrgDocuments(orgId, { history: true }),
		enabled: !!orgId && enabled,
	});
}

export function useUploadStakeholderDocument(orgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: UploadDocumentInput) =>
			DocumentsApi.uploadStakeholderDocument(orgId, input),
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: orgDocsKey(orgId) });
			qc.invalidateQueries({ queryKey: ["stakeholder-documents", "queue"] });
			toast.success("Document uploaded. FAAN will review it.");
		},
		onError: (err: unknown) =>
			toast.error(errorMessage(err, "Could not upload the document")),
	});
}

export function useReviewStakeholderDocument(orgId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (v: {
			documentId: string;
			decision: DocumentDecision;
			comments?: string;
		}) =>
			DocumentsApi.reviewStakeholderDocument(v.documentId, {
				decision: v.decision,
				comments: v.comments,
			}),
		onSuccess: (_doc, v) => {
			qc.invalidateQueries({ queryKey: orgDocsKey(orgId) });
			qc.invalidateQueries({ queryKey: ["stakeholder-documents", "queue"] });
			toast.success(
				v.decision === "approve"
					? "Document approved"
					: v.decision === "reject"
						? "Document rejected. The company has been told why."
						: "Sent back to the company for more information",
			);
		},
		onError: (err: unknown) =>
			toast.error(errorMessage(err, "Could not save the review")),
	});
}

export function useDocumentQueue(params: DocumentQueueParams) {
	return useQuery({
		queryKey: ["stakeholder-documents", "queue", params],
		queryFn: () => DocumentsApi.listDocumentQueue(params),
	});
}
