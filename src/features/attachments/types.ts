export interface AttachmentItem {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  url: string;
  path: string;
  createdAt: string;
}

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  maxSizeMB?: number;
  allowedTypes?: string[];
  onProgress?: (progress: number) => void;
}

export class AttachmentError extends Error {
  constructor(message: string, public readonly code: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AttachmentError';
  }
}
