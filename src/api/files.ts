import { api } from "./client";
import type { FileInfo, UploadFileRequest } from "@/types/file";

export async function uploadFile(input: UploadFileRequest): Promise<FileInfo> {
    const formData = new FormData();
    formData.append("file", input.file);
    formData.append("category", input.category);
    formData.append("relatedEntityType", input.relatedEntityType);
    formData.append("relatedEntityId", input.relatedEntityId);
    formData.append("isPublic", String(input.isPublic));

    const res = await api.post("/uploads", formData, {
        headers: {
            "Content-Type": "multipart/form-data"
        }
    });

    return res.data.data ?? res.data;
}

export async function getFileInfo(id: string): Promise<FileInfo> {
    const res = await api.get(`/uploads/${id}`);
    return res.data.data ?? res.data;
}

export async function downloadFile(id: string): Promise<Blob> {
    const res = await api.get(`/uploads/${id}/download`, { responseType: "blob" });
    return res.data;
}

export async function getFilesByEntity(type: string, id: string): Promise<FileInfo[]> {
    const res = await api.get(`/uploads/entity/${type}/${id}`);
    return res.data.data ?? res.data;
}

export async function deleteFile(id: string): Promise<void> {
    await api.delete(`/uploads/${id}`);
}
