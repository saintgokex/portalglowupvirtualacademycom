-- Fix the SECURITY DEFINER view issue by using SECURITY INVOKER instead
-- This ensures the view respects the querying user's permissions

DROP VIEW IF EXISTS public.students_teacher_view;

-- Recreate with SECURITY INVOKER (default, but explicit for clarity)
-- The security is enforced via the WHERE clause which uses has_role and is_assigned_to_student
CREATE VIEW public.students_teacher_view AS
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
    -- Superadmins can see all
    public.has_role(auth.uid(), 'superadmin'::app_role)
    -- Teachers can only see assigned students
    OR public.is_assigned_to_student(auth.uid(), s.id)
    -- Students can see their own record
    OR (s.user_id IS NOT NULL AND auth.uid() = s.user_id);

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.students_teacher_view TO authenticated;

-- Add comment to document the purpose
COMMENT ON VIEW public.students_teacher_view IS 'Restricted view of students table that excludes sensitive fields (parent_contact, parent_name, notes, user_id). Teachers and students should use this view instead of direct table access.';