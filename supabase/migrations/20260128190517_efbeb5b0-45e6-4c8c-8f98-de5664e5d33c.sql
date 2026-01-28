-- Recreate students_teacher_view with proper security invoker settings
DROP VIEW IF EXISTS public.students_teacher_view;

CREATE VIEW public.students_teacher_view
WITH (security_barrier = true)
AS
SELECT 
  id,
  name,
  status,
  progress,
  grade,
  subjects,
  created_at,
  updated_at
FROM public.students;

-- Grant SELECT to authenticated users (underlying RLS on students will filter)
GRANT SELECT ON public.students_teacher_view TO authenticated;