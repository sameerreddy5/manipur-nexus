-- Create reports configuration table
CREATE TABLE public.reports_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create reports data cache table for performance
CREATE TABLE public.reports_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_config_id UUID NOT NULL,
  data JSONB NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  generated_by UUID NOT NULL
);

-- Create report views/access log
CREATE TABLE public.report_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_config_id UUID NOT NULL,
  viewed_by UUID NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  view_duration INTEGER -- in seconds
);

-- Enable RLS
ALTER TABLE public.reports_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports_config
CREATE POLICY "Admins and Academic Section can manage report configs" 
ON public.reports_config 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['Admin', 'Academic Section']));

CREATE POLICY "Faculty can view report configs" 
ON public.reports_config 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['Admin', 'Academic Section', 'Faculty']));

-- RLS Policies for reports_data
CREATE POLICY "Users can view cached report data" 
ON public.reports_data 
FOR SELECT 
USING (get_current_user_role() = ANY(ARRAY['Admin', 'Academic Section', 'Faculty']));

CREATE POLICY "Admins and Academic Section can manage report data" 
ON public.reports_data 
FOR ALL 
USING (get_current_user_role() = ANY(ARRAY['Admin', 'Academic Section']));

-- RLS Policies for report_views
CREATE POLICY "Users can create their own report views" 
ON public.report_views 
FOR INSERT 
WITH CHECK (viewed_by = auth.uid());

CREATE POLICY "Admins can view all report access logs" 
ON public.report_views 
FOR SELECT 
USING (get_current_user_role() = 'Admin');

-- Add foreign key constraints
ALTER TABLE public.reports_data 
ADD CONSTRAINT fk_reports_data_config 
FOREIGN KEY (report_config_id) REFERENCES public.reports_config(id) ON DELETE CASCADE;

ALTER TABLE public.report_views 
ADD CONSTRAINT fk_report_views_config 
FOREIGN KEY (report_config_id) REFERENCES public.reports_config(id) ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX idx_reports_config_type ON public.reports_config(report_type);
CREATE INDEX idx_reports_config_active ON public.reports_config(is_active);
CREATE INDEX idx_reports_data_config ON public.reports_data(report_config_id);
CREATE INDEX idx_reports_data_expires ON public.reports_data(expires_at);
CREATE INDEX idx_report_views_config ON public.report_views(report_config_id);
CREATE INDEX idx_report_views_date ON public.report_views(viewed_at);

-- Create trigger for updating updated_at
CREATE TRIGGER update_reports_config_updated_at
BEFORE UPDATE ON public.reports_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default report configurations
INSERT INTO public.reports_config (name, description, report_type, config, created_by) VALUES
('Student Enrollment by Department', 'Shows student distribution across departments', 'enrollment_stats', '{"chart_type": "bar", "group_by": "department"}', (SELECT user_id FROM public.profiles WHERE role = 'Admin' LIMIT 1)),
('Faculty Workload Distribution', 'Displays course assignments per faculty member', 'faculty_workload', '{"chart_type": "pie", "include_courses": true}', (SELECT user_id FROM public.profiles WHERE role = 'Admin' LIMIT 1)),
('Academic Query Resolution Metrics', 'Tracks query response times and resolution rates', 'query_analytics', '{"chart_type": "line", "time_period": "monthly"}', (SELECT user_id FROM public.profiles WHERE role = 'Admin' LIMIT 1)),
('Hostel Complaint Trends', 'Analyzes complaint patterns and resolution times', 'hostel_analytics', '{"chart_type": "area", "group_by": "issue_type"}', (SELECT user_id FROM public.profiles WHERE role = 'Admin' LIMIT 1)),
('Course Assignment Overview', 'Shows course-faculty assignments by semester', 'course_assignments', '{"chart_type": "bar", "group_by": "semester"}', (SELECT user_id FROM public.profiles WHERE role = 'Admin' LIMIT 1));