-- Create helper function to check if user is the student
CREATE OR REPLACE FUNCTION public.is_student_user(_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students
    WHERE id = _student_id
      AND user_id = _user_id
  )
$$;

-- Add SELECT policy for students on assignments
CREATE POLICY "Students can view own assignments"
ON public.assignments
FOR SELECT
USING (public.is_student_user(auth.uid(), student_id));

-- Add SELECT policy for students on reports
CREATE POLICY "Students can view own reports"
ON public.reports
FOR SELECT
USING (public.is_student_user(auth.uid(), student_id));

-- Add SELECT policy for students on notes
CREATE POLICY "Students can view own notes"
ON public.notes
FOR SELECT
USING (public.is_student_user(auth.uid(), student_id));