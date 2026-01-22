-- Create submissions table for student assignment uploads
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  feedback TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Students can view their own submissions
CREATE POLICY "Students can view own submissions"
ON public.submissions
FOR SELECT
USING (public.is_student_user(auth.uid(), student_id));

-- Students can insert their own submissions
CREATE POLICY "Students can submit assignments"
ON public.submissions
FOR INSERT
WITH CHECK (public.is_student_user(auth.uid(), student_id));

-- Teachers can view submissions for their students
CREATE POLICY "Teachers can view student submissions"
ON public.submissions
FOR SELECT
USING (auth.uid() = teacher_id);

-- Teachers can update submissions (add feedback, change status)
CREATE POLICY "Teachers can review submissions"
ON public.submissions
FOR UPDATE
USING (auth.uid() = teacher_id);

-- Superadmins can manage all submissions
CREATE POLICY "Admins can manage all submissions"
ON public.submissions
FOR ALL
USING (public.has_role(auth.uid(), 'superadmin'));

-- Create trigger for updated_at
CREATE TRIGGER update_submissions_updated_at
BEFORE UPDATE ON public.submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create submissions storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false);

-- Storage policies for submissions bucket
-- Students can upload their submissions
CREATE POLICY "Students can upload submissions"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'submissions' AND
  auth.uid() IS NOT NULL
);

-- Students can view their own submission files
CREATE POLICY "Students can view own submission files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.file_path = name
    AND public.is_student_user(auth.uid(), s.student_id)
  )
);

-- Teachers can view submission files from their students
CREATE POLICY "Teachers can view student submission files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'submissions' AND
  EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.file_path = name
    AND auth.uid() = s.teacher_id
  )
);

-- Superadmins can access all submission files
CREATE POLICY "Admins can access all submission files"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'submissions' AND
  public.has_role(auth.uid(), 'superadmin')
);