import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as InspectionsApi from "@/api/inspections";
import type { InspectionTemplateInput, InspectionInput, InspectionSubmitInput, InspectionListParams } from "@/types/inspection";
import { toast } from "sonner";

// Templates
export function useInspectionTemplates() {
  return useQuery({
    queryKey: ["inspections", "templates"],
    queryFn: () => InspectionsApi.getInspectionTemplates(),
  });
}

export function useInspectionTemplate(id: string) {
  return useQuery({
    queryKey: ["inspections", "templates", id],
    queryFn: () => InspectionsApi.getInspectionTemplate(id),
    enabled: !!id,
  });
}

export function useCreateInspectionTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InspectionTemplateInput) => InspectionsApi.createInspectionTemplate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections", "templates"] });
      toast.success("Template created");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create template"),
  });
}

// Inspections
export function useInspections(params?: InspectionListParams) {
  return useQuery({
    queryKey: ["inspections", params],
    queryFn: () => InspectionsApi.getInspections(params),
  });
}

export function useInspection(id: string) {
  return useQuery({
    queryKey: ["inspections", id],
    queryFn: () => InspectionsApi.getInspection(id),
    enabled: !!id,
  });
}

export function useMyInspections() {
  return useQuery({
    queryKey: ["inspections", "my"],
    queryFn: () => InspectionsApi.getMyInspections(),
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: InspectionInput) => InspectionsApi.createInspection(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      toast.success("Inspection started");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create inspection"),
  });
}

export function useSubmitInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InspectionSubmitInput }) => InspectionsApi.submitInspection(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      toast.success("Inspection submitted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to submit inspection"),
  });
}
