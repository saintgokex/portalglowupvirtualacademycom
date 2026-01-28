-- Fix 1: Add teacher SELECT policy for students table
CREATE POLICY "Teachers can view assigned students"
ON public.students
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'teacher'::app_role) 
  AND is_assigned_to_student(auth.uid(), id)
);

-- Fix 2: Replace permissive notification INSERT policy with service_role only
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);