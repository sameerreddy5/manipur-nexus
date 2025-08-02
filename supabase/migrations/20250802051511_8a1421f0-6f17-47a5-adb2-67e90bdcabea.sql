-- Create activity logs table for admin dashboard
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  target_type TEXT,
  target_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (get_current_user_role() = 'Admin');

-- Create backend health table
CREATE TABLE public.backend_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  response_time INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backend_health ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage backend health" 
ON public.backend_health 
FOR ALL 
USING (get_current_user_role() = 'Admin');

-- Add department type field to departments table
ALTER TABLE public.departments 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'academic',
ADD COLUMN IF NOT EXISTS hod_id UUID REFERENCES public.profiles(user_id);

-- Add roll_number field to profiles for students
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roll_number TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create sections table
CREATE TABLE public.sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, batch_id)
);

-- Enable RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage sections" 
ON public.sections 
FOR ALL 
USING (get_current_user_role() = 'Admin');

CREATE POLICY "Everyone can view sections" 
ON public.sections 
FOR SELECT 
USING (true);

-- Update academic_queries to support threading
ALTER TABLE public.academic_queries 
ADD COLUMN IF NOT EXISTS query_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Generate query_id for existing records
UPDATE public.academic_queries 
SET query_id = 'AQ' || TO_CHAR(created_at, 'YYYY') || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::TEXT, 3, '0')
WHERE query_id IS NULL;

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_sections_updated_at
BEFORE UPDATE ON public.sections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();