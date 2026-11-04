import { api } from "./client";
import type {
	ComplianceDocument,
	DocumentChecklist,
	DocumentDecision,
	DocumentQueueParams,
	UploadDocumentInput,
} from "@/types/stakeholder-documents";

/** The API wraps payloads as `{ success, data }`; some older routes return the payload bare. */
const unwrap = <T>(res: { data: unknown }): T => {
	const body = res.data as { data?: T } | T;
	return (
		body && typeof body === "object" && "data" in body
			? (body as { data: T }).data
			: body
	) as T;
};

export async function getDocumentChecklist(
	orgId: string,
): Promise<DocumentChecklist> {
	return unwrap(
		await api.get(`/stakeholder-orgs/${orgId}/documents/checklist`),
	);
}

export async function listOrgDocuments(
	orgId: string,
	opts: { history?: boolean } = {},
): Promise<ComplianceDocument[]> {
	return unwrap(
		await api.get(`/stakeholder-orgs/${orgId}/documents`, {
			params: opts.history ? { history: true } : undefined,
		}),
	);
}

export async function uploadStakeholderDocument(
	orgId: string,
	input: UploadDocumentInput,
): Promise<ComplianceDocument> {
	const form = new FormData();
	form.append("file", input.file);
	form.append("documentType", input.documentType);
	if (input.expiryDate) form.append("expiryDate", input.expiryDate);
	if (input.issuedDate) form.append("issuedDate", input.issuedDate);
	if (input.title) form.append("title", input.title);
	// No Content-Type header: the browser must add the multipart boundary itself.
	return unwrap(await api.post(`/stakeholder-orgs/${orgId}/documents`, form));
}

/** The file needs the auth header, so it is fetched as a blob rather than linked to. */
export async function fetchDocumentFile(documentId: string): Promise<Blob> {
	try {
		const res = await api.get(
			`/stakeholder-orgs/documents/${documentId}/file`,
			{
				responseType: "blob",
			},
		);
		return res.data;
	} catch (err: unknown) {
		// An error body arrives as a Blob here, so the server's message isn't readable; say it ourselves.
		const status = (err as { status?: number } | null)?.status;
		if (status === 410) {
			throw new Error(
				"The stored file is no longer available. Ask the company to upload it again.",
			);
		}
		if (status === 403)
			throw new Error("You don't have access to this document.");
		if (status === 404) throw new Error("This document no longer exists.");
		throw err;
	}
}

export async function reviewStakeholderDocument(
	documentId: string,
	body: { decision: DocumentDecision; comments?: string },
): Promise<ComplianceDocument> {
	const res = unwrap<{ document: ComplianceDocument }>(
		await api.post(`/stakeholder-orgs/documents/${documentId}/review`, body),
	);
	return res.document;
}

export async function listDocumentQueue(
	params: DocumentQueueParams = {},
): Promise<ComplianceDocument[]> {
	return unwrap(await api.get("/stakeholder-orgs/documents", { params }));
}
