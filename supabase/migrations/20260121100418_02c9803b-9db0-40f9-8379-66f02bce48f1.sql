-- Fix security issues for students_teacher_view
-- Using security_barrier to prevent data leakage via optimization
-- The view excludes sensitive fields and includes access control in WHERE clause

DROP VIEW IF EXISTS public.students_teacher_view;

CREATE VIEW public.students_teacher_view
WITH (security_barrier = true)
AS
SELECT 
  s.id,
  s.name,
  s.status,
  s.progress,
  s.grade,
  s.subjects,
  s.created_at,
  s.updated_at
FROM public.students s
WHERE 
  -- Superadmins can see all students
  public.has_role(auth.uid(), 'superadmin'::public.app_role)
  OR
  -- Teachers can only see students assigned to them
  public.is_assigned_to_student(auth.uid(), s.id);

-- Grant access to authenticated users (access is controlled by WHERE clause)
GRANT SELECT ON public.students_teacher_view TO authenticated;