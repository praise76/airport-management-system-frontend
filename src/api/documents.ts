import type {
	Document,
	DocumentDirection,
	DocumentListResponse,
	DocumentWorkflowResponse,
  Template, 
  CreateTemplateRequest, 
  PreviewTemplateRequest, 
  GenerateDocumentRequest, 
  BulkOperationRequest
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
  file?: File;
};

export async function registerDocument(
	input: RegisterDocumentRequest,
): Promise<Document> {
  const formData = new FormData();
  formData.append("organizationId", input.organizationId);
  formData.append("registryNumber", input.registryNumber);
  formData.append("direction", input.direction);
  formData.append("subject", input.subject);
  formData.append("documentType", input.documentType);
  if (input.priority) formData.append("priority", input.priority);
  if (input.file) formData.append("file", input.file);

	const res = await api.post("/documents/register", formData);
	const payload = (res.data?.data ?? res.data) as Document;
	return payload;
}

export type ForwardDocumentRequest = {
	toUserId?: string;
	toRole?: string;
	comments?: string;
};

export type ReturnDocumentRequest = {
	toRole?: string;
	comments?: string;
};

export type ApproveDocumentRequest = {
	comments?: string;
};

export type RejectDocumentRequest = {
	comments?: string;
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

// Templates

export async function listTemplates(params?: { categoryId?: string; templateType?: string }): Promise<Template[]> {
  const res = await api.get("/templates", { params });
  return res.data;
}

export async function createTemplate(input: CreateTemplateRequest): Promise<Template> {
  const res = await api.post("/templates", input);
  return res.data;
}

export async function previewTemplate(id: string, input: PreviewTemplateRequest): Promise<void> {
  await api.post(`/templates/${id}/preview`, input);
}

export async function generateDocument(input: GenerateDocumentRequest): Promise<void> {
  await api.post("/templates/generate", input);
}

export async function listGeneratedDocuments(params?: { forUserId?: string; templateId?: string }): Promise<any> {
    const res = await api.get("/templates/documents", { params });
    return res.data;
}

export async function createBulkOperation(input: BulkOperationRequest): Promise<void> {
  await api.post("/templates/bulk", input);
}
