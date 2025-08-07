import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Upload, 
  File, 
  Image, 
  X, 
  Download,
  Eye,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  bucket: 'documents' | 'images' | 'assignments' | 'profile-pictures';
  category?: string;
  relatedId?: string;
  relatedType?: string;
  accept?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  onUpload?: (files: UploadedFile[]) => void;
  className?: string;
}

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

const FileUpload: React.FC<FileUploadProps> = ({
  bucket,
  category,
  relatedId,
  relatedType,
  accept,
  maxSize = 10,
  multiple = false,
  onUpload,
  className
}) => {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File ${file.name} is too large. Max size: ${maxSize}MB`);
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    if (!session?.user?.id) {
      toast.error('Not authenticated');
      return null;
    }

    if (!validateFile(file)) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

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
          category,
          related_id: relatedId,
          related_type: relatedType
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return {
        id: dbData.id,
        filename: dbData.filename,
        originalName: dbData.original_name,
        filePath: dbData.file_path,
        fileSize: dbData.file_size,
        mimeType: dbData.mime_type,
        uploadedAt: dbData.uploaded_at,
        publicUrl
      };
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!files.length) return;

    setUploading(true);
    setUploadProgress(0);

    const uploadPromises = Array.from(files).map(async (file, index) => {
      const result = await uploadFile(file);
      setUploadProgress(((index + 1) / files.length) * 100);
      return result;
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean) as UploadedFile[];

    setUploadedFiles(prev => [...prev, ...successfulUploads]);
    setUploading(false);
    setUploadProgress(0);

    if (successfulUploads.length > 0) {
      toast.success(`Successfully uploaded ${successfulUploads.length} file(s)`);
      onUpload?.(successfulUploads);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const downloadFile = async (file: UploadedFile) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(file.filename);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const deleteFile = async (file: UploadedFile) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([file.filename]);

      if (storageError) throw storageError;

      // Mark as deleted in database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .update({ is_deleted: true })
        .eq('id', file.id);

      if (dbError) throw dbError;

      setUploadedFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    return File;
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card 
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          uploading && "pointer-events-none opacity-50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-8 px-6 text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {dragActive ? "Drop files here" : "Upload files"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop files here, or click to select
          </p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Max: {maxSize}MB</Badge>
            {accept && <Badge variant="outline">{accept}</Badge>}
            {multiple && <Badge variant="outline">Multiple files</Badge>}
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files</h4>
          {uploadedFiles.map((file) => {
            const FileIcon = getFileIcon(file.mimeType);
            return (
              <Card key={file.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.publicUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.publicUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;