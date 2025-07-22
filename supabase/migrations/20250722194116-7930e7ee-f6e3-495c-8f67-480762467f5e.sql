-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create a security definer function to get current user's role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'Admin'
);

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  public.get_current_user_role() = 'Admin'
);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  public.get_current_user_role() = 'Admin'
);

-- Update announcements policies to use the same function
DROP POLICY IF EXISTS "Admins and Faculty can create announcements" ON public.announcements;
DROP POLICY IF EXISTS "Users can view announcements targeted to their role" ON public.announcements;

CREATE POLICY "Admins and Faculty can create announcements" 
ON public.announcements 
FOR INSERT 
WITH CHECK (
  public.get_current_user_role() IN ('Admin', 'Faculty')
);

CREATE POLICY "Users can view announcements targeted to their role" 
ON public.announcements 
FOR SELECT 
USING (
  array_length(target_roles, 1) IS NULL OR
  public.get_current_user_role() = ANY(target_roles)
);

-- Update departments and batches policies
DROP POLICY IF EXISTS "Admins can manage departments" ON public.departments;
DROP POLICY IF EXISTS "Admins can manage batches" ON public.batches;

CREATE POLICY "Admins can manage departments" 
ON public.departments 
FOR ALL 
USING (public.get_current_user_role() = 'Admin');

CREATE POLICY "Admins can manage batches" 
ON public.batches 
FOR ALL 
USING (public.get_current_user_role() = 'Admin');