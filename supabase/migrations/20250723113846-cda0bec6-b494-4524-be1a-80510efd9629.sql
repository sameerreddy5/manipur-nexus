-- Create hostel_complaints table
CREATE TABLE public.hostel_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  hostel_block TEXT NOT NULL,
  room_number TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
  warden_remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create mess_menus table
CREATE TABLE public.mess_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner')),
  items TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date, meal_type)
);

-- Create timetables table
CREATE TABLE public.timetables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  time_slot TEXT NOT NULL,
  subject TEXT NOT NULL,
  faculty_id UUID,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create holidays table
CREATE TABLE public.holidays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('National', 'Regional', 'Institute')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department_id UUID,
  credits INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_assignments table
CREATE TABLE public.course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  faculty_id UUID NOT NULL,
  batch_id UUID NOT NULL,
  semester TEXT NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, batch_id, semester, year)
);

-- Create academic_queries table
CREATE TABLE public.academic_queries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  faculty_id UUID NOT NULL,
  course_id UUID,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  parent_id UUID, -- For threaded replies
  status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Replied', 'Closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.hostel_complaints ADD CONSTRAINT fk_hostel_complaints_student 
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.mess_menus ADD CONSTRAINT fk_mess_menus_created_by 
  FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

ALTER TABLE public.timetables ADD CONSTRAINT fk_timetables_batch 
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);

ALTER TABLE public.timetables ADD CONSTRAINT fk_timetables_faculty 
  FOREIGN KEY (faculty_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.courses ADD CONSTRAINT fk_courses_department 
  FOREIGN KEY (department_id) REFERENCES public.departments(id);

ALTER TABLE public.course_assignments ADD CONSTRAINT fk_course_assignments_course 
  FOREIGN KEY (course_id) REFERENCES public.courses(id);

ALTER TABLE public.course_assignments ADD CONSTRAINT fk_course_assignments_faculty 
  FOREIGN KEY (faculty_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.course_assignments ADD CONSTRAINT fk_course_assignments_batch 
  FOREIGN KEY (batch_id) REFERENCES public.batches(id);

ALTER TABLE public.academic_queries ADD CONSTRAINT fk_academic_queries_student 
  FOREIGN KEY (student_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.academic_queries ADD CONSTRAINT fk_academic_queries_faculty 
  FOREIGN KEY (faculty_id) REFERENCES public.profiles(user_id);

ALTER TABLE public.academic_queries ADD CONSTRAINT fk_academic_queries_course 
  FOREIGN KEY (course_id) REFERENCES public.courses(id);

ALTER TABLE public.academic_queries ADD CONSTRAINT fk_academic_queries_parent 
  FOREIGN KEY (parent_id) REFERENCES public.academic_queries(id);

-- Enable RLS on all tables
ALTER TABLE public.hostel_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_queries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hostel_complaints
CREATE POLICY "Students can view their own complaints" 
ON public.hostel_complaints FOR SELECT 
USING (student_id = auth.uid());

CREATE POLICY "Students can create complaints" 
ON public.hostel_complaints FOR INSERT 
WITH CHECK (student_id = auth.uid() AND get_current_user_role() = 'Student');

CREATE POLICY "Students can update their own complaints" 
ON public.hostel_complaints FOR UPDATE 
USING (student_id = auth.uid() AND get_current_user_role() = 'Student');

CREATE POLICY "Wardens can view all complaints" 
ON public.hostel_complaints FOR SELECT 
USING (get_current_user_role() = 'Hostel Warden');

CREATE POLICY "Wardens can update complaints" 
ON public.hostel_complaints FOR UPDATE 
USING (get_current_user_role() = 'Hostel Warden');

-- RLS Policies for mess_menus
CREATE POLICY "Everyone can view mess menus" 
ON public.mess_menus FOR SELECT 
USING (true);

CREATE POLICY "Mess supervisors can manage menus" 
ON public.mess_menus FOR ALL 
USING (get_current_user_role() = 'Mess Supervisor');

-- RLS Policies for timetables
CREATE POLICY "Everyone can view timetables" 
ON public.timetables FOR SELECT 
USING (true);

CREATE POLICY "Academic section can manage timetables" 
ON public.timetables FOR ALL 
USING (get_current_user_role() = 'Academic Section');

-- RLS Policies for holidays
CREATE POLICY "Everyone can view holidays" 
ON public.holidays FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage holidays" 
ON public.holidays FOR ALL 
USING (get_current_user_role() = 'Admin');

-- RLS Policies for courses
CREATE POLICY "Everyone can view courses" 
ON public.courses FOR SELECT 
USING (true);

CREATE POLICY "Academic section can manage courses" 
ON public.courses FOR ALL 
USING (get_current_user_role() = 'Academic Section');

-- RLS Policies for course_assignments
CREATE POLICY "Faculty can view their assignments" 
ON public.course_assignments FOR SELECT 
USING (faculty_id = auth.uid() OR get_current_user_role() = 'Academic Section');

CREATE POLICY "Academic section can manage assignments" 
ON public.course_assignments FOR ALL 
USING (get_current_user_role() = 'Academic Section');

-- RLS Policies for academic_queries
CREATE POLICY "Students can view their queries" 
ON public.academic_queries FOR SELECT 
USING (student_id = auth.uid() OR faculty_id = auth.uid());

CREATE POLICY "Students can create queries" 
ON public.academic_queries FOR INSERT 
WITH CHECK (student_id = auth.uid() AND get_current_user_role() = 'Student');

CREATE POLICY "Faculty can reply to queries" 
ON public.academic_queries FOR INSERT 
WITH CHECK (get_current_user_role() = 'Faculty' AND parent_id IS NOT NULL);

CREATE POLICY "Faculty can update query status" 
ON public.academic_queries FOR UPDATE 
USING (faculty_id = auth.uid() AND get_current_user_role() = 'Faculty');

-- Create triggers for updated_at columns
CREATE TRIGGER update_hostel_complaints_updated_at
  BEFORE UPDATE ON public.hostel_complaints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mess_menus_updated_at
  BEFORE UPDATE ON public.mess_menus
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_holidays_updated_at
  BEFORE UPDATE ON public.holidays
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_assignments_updated_at
  BEFORE UPDATE ON public.course_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_queries_updated_at
  BEFORE UPDATE ON public.academic_queries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();