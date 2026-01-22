-- Add SELECT policy for students to view their teacher assignments
CREATE POLICY "Students can view own teacher assignments"
ON public.teacher_students
FOR SELECT
USING (public.is_student_user(auth.uid(), student_id));