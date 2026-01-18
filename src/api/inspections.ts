import { api } from "./client";
import type {
  InspectionTemplate,
  InspectionTemplateInput,
  Inspection,
  InspectionInput,
  InspectionSubmitInput,
  InspectionListParams,
} from "@/types/inspection";

// Templates
export async function getInspectionTemplates(): Promise<InspectionTemplate[]> {
  const res = await api.get("/inspections/templates");
  return res.data.data;
}

export async function getInspectionTemplate(id: string): Promise<InspectionTemplate> {
  const res = await api.get(`/inspections/templates/${id}`);
  return res.data.data;
}

export async function createInspectionTemplate(input: InspectionTemplateInput): Promise<InspectionTemplate> {
  const res = await api.post("/inspections/templates", input);
  return res.data.data;
}

export async function updateInspectionTemplate(id: string, input: Partial<InspectionTemplateInput>): Promise<InspectionTemplate> {
  const res = await api.patch(`/inspections/templates/${id}`, input);
  return res.data.data;
}

// Inspections
export async function getInspections(params?: InspectionListParams): Promise<{ data: Inspection[]; pagination?: any }> {
  const res = await api.get("/inspections", { params });
  return res.data.data;
}

export async function getInspection(id: string): Promise<Inspection> {
  const res = await api.get(`/inspections/${id}`);
  return res.data.data;
}

export async function createInspection(input: InspectionInput): Promise<Inspection> {
  const res = await api.post("/inspections", input);
  return res.data.data;
}

export async function submitInspection(id: string, input: InspectionSubmitInput): Promise<Inspection> {
  const res = await api.post(`/inspections/${id}/submit`, input);
  return res.data.data;
}

export async function getMyInspections(): Promise<Inspection[]> {
  const res = await api.get("/inspections/my");
  return res.data.data;
}
