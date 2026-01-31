export type DocumentDirection = "incoming" | "outgoing" | "internal";

export interface Document {
	id: string;
	organizationId: string;
	registryNumber: string;
	direction: DocumentDirection;
	subject: string;
	documentType: string;
	priority: string;
	status: string;
	workflowStage: string;
  fileUrl?: string;
  fileId?: string;
}

export interface DocumentListResponse {
	data: Document[];
	pagination?: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export interface DocumentWorkflowEntry {
	id: string;
	action: string;
	comment?: string | null;
	performedBy: string;
	performedAt: string;
	fromDepartmentId?: string | null;
	toDepartmentId?: string | null;
}

export interface DocumentWorkflowResponse {
	data: DocumentWorkflowEntry[];
}

export type Template = {
  id: string
  templateName: string
  templateType: string
  contentHtml: string
  variableSchema: Array<{
    name: string
    type: string
    required: boolean
  }>
}

export type GenerateDocumentRequest = {
  templateId: string
  title: string
  variables: Record<string, any>
  forUserId?: string
  generatePdf?: boolean
}

export type CreateTemplateRequest = Omit<Template, 'id'>

export type PreviewTemplateRequest = {
  variables: Record<string, any>
}

export type BulkOperationRequest = {
  operationType: string
  operationName: string
  inputFileUrl: string
}
