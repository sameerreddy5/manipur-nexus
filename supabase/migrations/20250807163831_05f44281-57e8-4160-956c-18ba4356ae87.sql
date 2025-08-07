-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES 
('documents', 'documents', false),
('images', 'images', true),
('assignments', 'assignments', false),
('profile-pictures', 'profile-pictures', true);

-- Create file_uploads table to track uploaded files
CREATE TABLE public.file_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  category TEXT, -- 'document', 'image', 'assignment', 'profile'
  related_id UUID, -- ID of related entity (query, assignment, etc.)
  related_type TEXT, -- 'academic_query', 'assignment', 'profile', etc.
  is_deleted BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_uploads
CREATE POLICY "Users can view their own uploads" 
ON public.file_uploads 
FOR SELECT 
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload files" 
ON public.file_uploads 
FOR INSERT 
WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own uploads" 
ON public.file_uploads 
FOR UPDATE 
USING (uploaded_by = auth.uid());

CREATE POLICY "Admins can view all uploads" 
ON public.file_uploads 
FOR SELECT 
USING (get_current_user_role() = 'Admin');

-- Storage policies for documents bucket (private)
CREATE POLICY "Users can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for images bucket (public)
CREATE POLICY "Images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

CREATE POLICY "Users can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for assignments bucket (private)
CREATE POLICY "Students can view their own assignments" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Faculty can view assignment submissions" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'assignments' AND get_current_user_role() = 'Faculty');

CREATE POLICY "Students can upload assignments" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for profile pictures bucket (public)
CREATE POLICY "Profile pictures are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can upload their own profile picture" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile picture" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile picture" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add indexes for performance
CREATE INDEX idx_file_uploads_user ON public.file_uploads(uploaded_by);
CREATE INDEX idx_file_uploads_category ON public.file_uploads(category);
CREATE INDEX idx_file_uploads_related ON public.file_uploads(related_id, related_type);
CREATE INDEX idx_file_uploads_bucket ON public.file_uploads(bucket_name);