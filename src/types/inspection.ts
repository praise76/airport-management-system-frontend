// Inspection Types based on OpenAPI spec

export type InspectionStatus = "in_progress" | "submitted";

export interface InspectionTemplate {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  questions?: InspectionQuestion[];
  isActive?: boolean;
  createdAt?: string;
}

export interface InspectionQuestion {
  id?: string;
  question: string;
  questionType: "text" | "boolean" | "choice" | "rating";
  options?: string[];
  required?: boolean;
}

export interface InspectionTemplateInput {
  organizationId: string;
  name: string;
  description?: string;
  questions?: InspectionQuestion[];
}

export interface Inspection {
  id: string;
  organizationId: string;
  templateId: string | null;
  status: InspectionStatus;
  terminalCode?: string;
  location?: string;
  createdBy?: string;
  createdAt: string;
  submittedAt: string | null;
  template?: InspectionTemplate;
}

export interface InspectionInput {
  templateId?: string;
  terminalCode?: string;
  location?: string;
}

export interface InspectionResponse {
  questionId: string;
  answer: string;
  notes?: string;
}

export interface InspectionSubmitInput {
  responses: InspectionResponse[];
}

export interface InspectionListParams {
  page?: number;
  limit?: number;
  status?: InspectionStatus;
  templateId?: string;
}
