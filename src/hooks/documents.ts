import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocsApi from "@/api/documents";
import { toast } from "sonner";

export function useDocuments(params?: DocsApi.ListDocumentsParams) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => DocsApi.listDocuments(params),
  });
}

// Helper to validate document ID format (should be a UUID or similar, not 'new' or other placeholder values)
function isValidDocumentId(id: string): boolean {
  if (!id || id === "new" || id === "undefined" || id === "null") return false;
  // Basic UUID-like validation (can be adjusted based on actual ID format)
  return id.length > 5 && !id.includes(" ");
}

export function useDocumentWorkflow(id: string) {
  return useQuery({
    queryKey: ["documents", id, "workflow"],
    queryFn: () => DocsApi.getDocumentWorkflow(id),
    enabled: isValidDocumentId(id),
  });
}

export function useRegisterDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocsApi.RegisterDocumentRequest) => DocsApi.registerDocument(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document registered successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to register document");
    },
  });
}

export function useForwardDocument(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DocsApi.ForwardDocumentRequest) => DocsApi.forwardDocument(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["documents", id, "workflow"] });
      toast.success("Document forwarded");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to forward document");
    },
  });
}

// ... other actions (approve, reject, return) would follow similar pattern

export function useTemplates(params?: { categoryId?: string; templateType?: string }) {
  return useQuery({
    queryKey: ["templates", params],
    queryFn: () => DocsApi.listTemplates(params),
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof DocsApi.createTemplate>[0]) => DocsApi.createTemplate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Template created");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create template");
    },
  });
}

export function useGenerateDocument() {
  return useMutation({
    mutationFn: (input: Parameters<typeof DocsApi.generateDocument>[0]) => DocsApi.generateDocument(input),
    onSuccess: () => {
      toast.success("Document generated");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to generate document");
    },
  });
}
