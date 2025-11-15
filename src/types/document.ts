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
