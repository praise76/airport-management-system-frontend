import type {
	Document,
	DocumentDirection,
	DocumentListResponse,
	DocumentWorkflowResponse,
} from "@/types/document";
import { api } from "./client";

export type ListDocumentsParams = {
	page?: number;
	limit?: number;
	direction?: DocumentDirection;
	status?: string;
	documentType?: string;
};

export async function listDocuments(
	params: ListDocumentsParams = {},
): Promise<DocumentListResponse> {
	const res = await api.get("/documents", { params });
	const payload = res?.data as DocumentListResponse;
	return payload;
}

export type RegisterDocumentRequest = {
	organizationId: string;
	registryNumber: string;
	direction: DocumentDirection;
	subject: string;
	documentType: string;
	priority?: string;
};

export async function registerDocument(
	input: RegisterDocumentRequest,
): Promise<Document> {
	const res = await api.post("/documents/register", input);
	const payload = (res.data?.data ?? res.data) as Document;
	return payload;
}

export type ForwardDocumentRequest = {
	toDepartmentId: string;
	comment?: string;
};

export type ReturnDocumentRequest = {
	toDepartmentId: string;
	comment?: string;
};

export type ApproveDocumentRequest = {
	comment?: string;
};

export type RejectDocumentRequest = {
	comment?: string;
};

export async function forwardDocument(
	id: string,
	input: ForwardDocumentRequest,
): Promise<Document> {
	const res = await api.post(`/documents/${id}/forward`, input);
	const payload = (res.data?.data ?? res.data) as Document;
	return payload;
}

export async function returnDocument(
	id: string,
	input: ReturnDocumentRequest,
): Promise<Document> {
	const res = await api.post(`/documents/${id}/return`, input);
	const payload = (res.data?.data ?? res.data) as Document;
	return payload;
}

export async function approveDocument(
	id: string,
	input: ApproveDocumentRequest,
): Promise<Document> {
	const res = await api.post(`/documents/${id}/approve`, input);
	const payload = (res.data?.data ?? res.data) as Document;
	return payload;
}

export async function rejectDocument(
	id: string,
	input: RejectDocumentRequest,
): Promise<Document> {
	const res = await api.post(`/documents/${id}/reject`, input);
	const payload = (res.data?.data ?? res.data) as Document;
	return payload;
}

export async function getDocumentWorkflow(
	id: string,
): Promise<DocumentWorkflowResponse> {
	const res = await api.get(`/documents/${id}/workflow`);
	const payload = (res.data?.data ?? res.data) as DocumentWorkflowResponse;
	return payload;
}
