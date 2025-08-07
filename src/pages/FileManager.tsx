import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FileUpload from "@/components/ui/file-upload";
import { 
  Files, 
  Search, 
  Filter,
  Download,
  Trash2,
  Eye,
  Image,
  FileText,
  GraduationCap,
  User
} from "lucide-react";

interface FileRecord {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  bucket_name: string;
  uploaded_at: string;
  category?: string;
  related_type?: string;
  is_deleted: boolean;
}

export default function FileManager() {
  const { user, session } = useAuth();
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('is_deleted', false)
        .eq('uploaded_by', session?.user?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || file.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categorizeFiles = (category: string) => {
    return filteredFiles.filter(file => file.category === category);
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
    if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
    return Files;
  };

  const downloadFile = async (file: FileRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from(file.bucket_name)
        .download(file.filename);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const deleteFile = async (file: FileRecord) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(file.bucket_name)
        .remove([file.filename]);

      if (storageError) throw storageError;

      // Mark as deleted in database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .update({ is_deleted: true })
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== file.id));
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const viewFile = async (file: FileRecord) => {
    try {
      if (file.bucket_name === 'images' || file.bucket_name === 'profile-pictures') {
        const { data } = supabase.storage
          .from(file.bucket_name)
          .getPublicUrl(file.filename);
        window.open(data.publicUrl, '_blank');
      } else {
        const { data, error } = await supabase.storage
          .from(file.bucket_name)
          .createSignedUrl(file.filename, 3600);

        if (error) throw error;
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      toast.error('Failed to view file');
    }
  };

  const getTotalStorage = () => {
    return files.reduce((total, file) => total + file.file_size, 0);
  };

  const getCategoryStats = () => {
    const stats = files.reduce((acc, file) => {
      const category = file.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  const categoryStats = getCategoryStats();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Files className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">File Manager</h1>
            <p className="text-muted-foreground">
              Manage your documents, images, and assignments
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Files className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(getTotalStorage())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Images</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.image || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categoryStats.document || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          <option value="document">Documents</option>
          <option value="image">Images</option>
          <option value="assignment">Assignments</option>
          <option value="profile">Profile</option>
        </select>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="all">All Files</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Upload Documents
                </CardTitle>
                <CardDescription>
                  Upload PDF, Word documents, spreadsheets, and other files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="documents"
                  category="document"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  maxSize={50}
                  multiple
                  onUpload={() => fetchFiles()}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Upload Images
                </CardTitle>
                <CardDescription>
                  Upload photos, screenshots, and other images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  bucket="images"
                  category="image"
                  accept="image/*"
                  maxSize={10}
                  multiple
                  onUpload={() => fetchFiles()}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid grid-cols-1 gap-4">
            {categorizeFiles('document').map((file) => {
              const FileIcon = getFileIcon(file.mime_type);
              return (
                <Card key={file.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.original_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => viewFile(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteFile(file)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="images">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categorizeFiles('image').map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="aspect-square bg-muted rounded-lg mb-3 overflow-hidden">
                    <img
                      src={supabase.storage.from(file.bucket_name).getPublicUrl(file.filename).data.publicUrl}
                      alt={file.original_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium truncate">{file.original_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                    <div className="flex justify-between">
                      <Button variant="ghost" size="sm" onClick={() => viewFile(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteFile(file)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="assignments">
          <div className="grid grid-cols-1 gap-4">
            {categorizeFiles('assignment').map((file) => {
              const FileIcon = getFileIcon(file.mime_type);
              return (
                <Card key={file.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.original_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => viewFile(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteFile(file)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="grid grid-cols-1 gap-4">
            {filteredFiles.map((file) => {
              const FileIcon = getFileIcon(file.mime_type);
              return (
                <Card key={file.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{file.original_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                        {file.category && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {file.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => viewFile(file)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteFile(file)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}