import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as FilesApi from "@/api/files";
import { toast } from "sonner";

export function useUploadFile() {
  return useMutation({
    mutationFn: (input: Parameters<typeof FilesApi.uploadFile>[0]) => FilesApi.uploadFile(input),
    onSuccess: () => {
      toast.success("File uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload file");
    },
  });
}

export function useFiles(type: string, id: string) {
  return useQuery({
    queryKey: ["files", type, id],
    queryFn: () => FilesApi.getFilesByEntity(type, id),
    enabled: !!type && !!id,
  });
}

export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FilesApi.deleteFile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["files"] });
      toast.success("File deleted");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete file");
    },
  });
}
