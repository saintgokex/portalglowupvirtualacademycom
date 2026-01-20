
-- Create storage bucket for reports
INSERT INTO storage.buckets (id, name, public) VALUES ('reports', 'reports', false);

-- Create storage bucket for notes
INSERT INTO storage.buckets (id, name, public) VALUES ('notes', 'notes', false);

-- Create storage bucket for assignments
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false);

-- RLS policies for reports bucket
CREATE POLICY "Teachers can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND 
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Teachers can view their own reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND 
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'superadmin'))
  );

CREATE POLICY "Admins can manage all reports" ON storage.objects
  FOR ALL USING (
    bucket_id = 'reports' AND 
    public.has_role(auth.uid(), 'superadmin')
  );

-- RLS policies for notes bucket
CREATE POLICY "Teachers can upload notes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'notes' AND 
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Teachers can view their own notes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'notes' AND 
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'superadmin'))
  );

-- RLS policies for assignments bucket
CREATE POLICY "Teachers can upload assignments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assignments' AND 
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Teachers can view their own assignments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignments' AND 
    (public.has_role(auth.uid(), 'teacher') OR public.has_role(auth.uid(), 'superadmin'))
  );

-- Create reports table to track uploaded reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notes table
CREATE TABLE public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leave_requests table
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Reports policies
CREATE POLICY "Teachers can manage own reports" ON public.reports
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

-- Notes policies
CREATE POLICY "Teachers can manage own notes" ON public.notes
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all notes" ON public.notes
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

-- Assignments policies
CREATE POLICY "Teachers can manage own assignments" ON public.assignments
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can view all assignments" ON public.assignments
  FOR SELECT USING (public.has_role(auth.uid(), 'superadmin'));

-- Leave requests policies
CREATE POLICY "Teachers can manage own leave requests" ON public.leave_requests
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "Admins can manage all leave requests" ON public.leave_requests
  FOR ALL USING (public.has_role(auth.uid(), 'superadmin'));
