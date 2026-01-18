export type FileUploadResponse = {
  id: string
  fileName: string
  originalName: string
  fileUrl: string
  fileSize: number
}

export type FileInfo = FileUploadResponse

export type UploadFileRequest = {
  file: File
  category: string
  relatedEntityType: string
  relatedEntityId: string
  isPublic: boolean
}
