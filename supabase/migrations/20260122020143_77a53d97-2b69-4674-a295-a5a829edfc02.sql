-- Create scheduled_sessions table for timetable feature
CREATE TABLE public.scheduled_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- Teachers can manage sessions they created or are assigned to
CREATE POLICY "Teachers can manage own sessions"
ON public.scheduled_sessions
FOR ALL
USING (auth.uid() = teacher_id OR auth.uid() = created_by);

-- Students can view their scheduled sessions
CREATE POLICY "Students can view own sessions"
ON public.scheduled_sessions
FOR SELECT
USING (is_student_user(auth.uid(), student_id));

-- Admins can manage all sessions
CREATE POLICY "Admins can manage all sessions"
ON public.scheduled_sessions
FOR ALL
USING (has_role(auth.uid(), 'superadmin'));

-- Create trigger for updated_at
CREATE TRIGGER update_scheduled_sessions_updated_at
BEFORE UPDATE ON public.scheduled_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policy for students to delete their unreviewed submissions
CREATE POLICY "Students can delete unreviewed submissions"
ON public.submissions
FOR DELETE
USING (
  is_student_user(auth.uid(), student_id) 
  AND status = 'submitted'
);

-- Add RLS policy for teachers to delete their own notes
CREATE POLICY "Teachers can delete own notes"
ON public.notes
FOR DELETE
USING (auth.uid() = teacher_id);

-- Add RLS policy for teachers to delete their own assignments
CREATE POLICY "Teachers can delete own assignments"
ON public.assignments
FOR DELETE
USING (auth.uid() = teacher_id);

-- Add RLS policy for teachers to delete their own reports
CREATE POLICY "Teachers can delete own reports"
ON public.reports
FOR DELETE
USING (auth.uid() = teacher_id);