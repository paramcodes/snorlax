import { supabase } from '../../shared/supabase/client';
import { AttachmentItem, UploadOptions, AttachmentError } from './types';

const DEFAULT_BUCKET = 'attachments';
const DEFAULT_MAX_SIZE_MB = 50;

export class AttachmentService {
  /**
   * Upload a file to Supabase Storage with validation, error handling, and URL generation.
   */
  public static async uploadFile(file: File, options?: UploadOptions): Promise<AttachmentItem> {
    const bucket = options?.bucket || DEFAULT_BUCKET;
    const maxSizeMB = options?.maxSizeMB || DEFAULT_MAX_SIZE_MB;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    // 1. Validate file size
    if (file.size > maxSizeBytes) {
      throw new AttachmentError(
        `File size exceeds maximum allowed limit of ${maxSizeMB}MB (file is ${(file.size / (1024 * 1024)).toFixed(2)}MB)`,
        'FILE_TOO_LARGE'
      );
    }

    // 2. Validate allowed types if specified
    if (options?.allowedTypes && options.allowedTypes.length > 0) {
      const isAllowed = options.allowedTypes.some((type) => {
        if (type.endsWith('/*')) {
          const prefix = type.split('/')[0];
          return file.type.startsWith(`${prefix}/`);
        }
        return file.type === type;
      });

      if (!isAllowed) {
        throw new AttachmentError(
          `File type '${file.type || 'unknown'}' is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`,
          'INVALID_FILE_TYPE'
        );
      }
    }

    try {
      const fileId = crypto.randomUUID();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const folder = options?.folder ? options.folder.replace(/^\/+|\/+$/g, '') : '';
      const filePath = folder ? `${folder}/${fileId}-${sanitizedName}` : `${fileId}-${sanitizedName}`;

      // 3. Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new AttachmentError(
          `Supabase storage upload failed: ${error.message}`,
          'STORAGE_UPLOAD_FAILED',
          error
        );
      }

      if (!data || !data.path) {
        throw new AttachmentError('Upload completed but no path was returned from storage', 'NO_STORAGE_PATH');
      }

      // 4. Get public URL (or signed URL if private bucket)
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);

      const attachmentItem: AttachmentItem = {
        id: fileId,
        fileName: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
        url: urlData.publicUrl,
        path: data.path,
        createdAt: new Date().toISOString(),
      };

      return attachmentItem;
    } catch (err) {
      if (err instanceof AttachmentError) {
        throw err;
      }
      throw new AttachmentError(
        `Unexpected error during file upload: ${err instanceof Error ? err.message : String(err)}`,
        'UNKNOWN_UPLOAD_ERROR',
        err
      );
    }
  }

  /**
   * Delete an attachment from Supabase Storage.
   */
  public static async deleteFile(path: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);
      if (error) {
        throw new AttachmentError(
          `Failed to delete file from storage: ${error.message}`,
          'STORAGE_DELETE_FAILED',
          error
        );
      }
    } catch (err) {
      if (err instanceof AttachmentError) {
        throw err;
      }
      throw new AttachmentError(
        `Unexpected error during file deletion: ${err instanceof Error ? err.message : String(err)}`,
        'UNKNOWN_DELETE_ERROR',
        err
      );
    }
  }

  /**
   * Get a signed URL for private bucket access with expiration in seconds.
   */
  public static async getSignedUrl(path: string, expiresIn: number = 3600, bucket: string = DEFAULT_BUCKET): Promise<string> {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
      if (error || !data) {
        throw new AttachmentError(
          `Failed to create signed URL: ${error?.message || 'No data returned'}`,
          'SIGNED_URL_FAILED',
          error
        );
      }
      return data.signedUrl;
    } catch (err) {
      if (err instanceof AttachmentError) {
        throw err;
      }
      throw new AttachmentError(
        `Unexpected error creating signed URL: ${err instanceof Error ? err.message : String(err)}`,
        'UNKNOWN_SIGNED_URL_ERROR',
        err
      );
    }
  }
}
