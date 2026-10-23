import { useState, useCallback } from 'react';
import { AttachmentService } from './attachmentService';
import { AttachmentItem, UploadOptions } from './types';

export function useAttachmentUpload(defaultOptions?: UploadOptions) {
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [attachment, setAttachment] = useState<AttachmentItem | null>(null);

  const upload = useCallback(async (file: File, options?: UploadOptions): Promise<AttachmentItem> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const mergedOptions: UploadOptions = {
      ...defaultOptions,
      ...options,
      onProgress: (p) => {
        setProgress(p);
        if (options?.onProgress) {
          options.onProgress(p);
        } else if (defaultOptions?.onProgress) {
          defaultOptions.onProgress(p);
        }
      },
    };

    try {
      // Simulate incremental progress start if needed
      setProgress(10);
      const result = await AttachmentService.uploadFile(file, mergedOptions);
      setProgress(100);
      setAttachment(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      throw errorObj;
    } finally {
      setUploading(false);
    }
  }, [defaultOptions]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setAttachment(null);
  }, []);

  return {
    upload,
    reset,
    uploading,
    progress,
    error,
    attachment,
  };
}
