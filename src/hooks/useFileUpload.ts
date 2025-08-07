import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  publicUrl?: string;
}

interface UseFileUploadOptions {
  bucket: 'documents' | 'images' | 'assignments' | 'profile-pictures';
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export const useFileUpload = ({ bucket, maxSize = 10, allowedTypes }: UseFileUploadOptions) => {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const validateFile = useCallback((file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File is too large. Max size: ${maxSize}MB`);
      return false;
    }

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      toast.error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
      return false;
    }

    return true;
  }, [maxSize, allowedTypes]);

  const uploadFile = useCallback(async (
    file: File, 
    options?: {
      category?: string;
      relatedId?: string;
      relatedType?: string;
    }
  ): Promise<UploadedFile | null> => {
    if (!session?.user?.id) {
      toast.error('Not authenticated');
      return null;
    }

    if (!validateFile(file)) return null;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setProgress(50);

      // Get public URL for public buckets
      let publicUrl;
      if (bucket === 'images' || bucket === 'profile-pictures') {
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      // Record in database
      const { data: dbData, error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          mime_type: file.type,
          bucket_name: bucket,
          uploaded_by: session.user.id,
          category: options?.category,
          related_id: options?.relatedId,
          related_type: options?.relatedType
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setProgress(100);
      
      const result: UploadedFile = {
        id: dbData.id,
        filename: dbData.filename,
        originalName: dbData.original_name,
        filePath: dbData.file_path,
        fileSize: dbData.file_size,
        mimeType: dbData.mime_type,
        uploadedAt: dbData.uploaded_at,
        publicUrl
      };

      toast.success('File uploaded successfully');
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [session, bucket, validateFile]);

  const uploadMultiple = useCallback(async (
    files: File[],
    options?: {
      category?: string;
      relatedId?: string;
      relatedType?: string;
    }
  ): Promise<UploadedFile[]> => {
    const results: UploadedFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await uploadFile(file, options);
      if (result) {
        results.push(result);
      }
      setProgress(((i + 1) / files.length) * 100);
    }

    return results;
  }, [uploadFile]);

  const deleteFile = useCallback(async (fileId: string, filename: string): Promise<boolean> => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filename]);

      if (storageError) throw storageError;

      // Mark as deleted in database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .update({ is_deleted: true })
        .eq('id', fileId);

      if (dbError) throw dbError;

      toast.success('File deleted successfully');
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
      return false;
    }
  }, [bucket]);

  const downloadFile = useCallback(async (filename: string, originalName: string): Promise<void> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filename);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  }, [bucket]);

  const getFileUrl = useCallback((filename: string): string | null => {
    if (bucket === 'images' || bucket === 'profile-pictures') {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filename);
      return data.publicUrl;
    }
    return null;
  }, [bucket]);

  const getSignedUrl = useCallback(async (filename: string, expiresIn = 3600): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filename, expiresIn);

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  }, [bucket]);

  return {
    uploadFile,
    uploadMultiple,
    deleteFile,
    downloadFile,
    getFileUrl,
    getSignedUrl,
    uploading,
    progress
  };
};