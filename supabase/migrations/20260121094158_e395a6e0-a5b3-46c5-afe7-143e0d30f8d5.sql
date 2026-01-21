-- Fix 1: Drop the existing teacher policy on students table and replace with restricted access
-- Teachers should use students_teacher_view which excludes sensitive fields
DROP POLICY IF EXISTS "Teachers can view assigned students" ON public.students;

-- Recreate policy that only allows teachers to SELECT non-sensitive columns
-- Since Postgres RLS doesn't support column-level security, we'll restrict teachers to use the view
-- by removing their direct access to the students table
-- Teachers must use students_teacher_view instead

-- Note: We're keeping access for teachers BUT the frontend must use the view
-- The view excludes: parent_name, parent_contact, notes, user_id, enrollment_date

-- Fix 2: Enable RLS on students_teacher_view and add proper policies
-- First, we need to ensure the view has RLS enabled

-- For views in PostgreSQL, RLS is inherited from the underlying table
-- However, we need to ensure the view is properly secured
-- The solution is to use security_barrier on the view

-- Drop and recreate the view with security_barrier
DROP VIEW IF EXISTS public.students_teacher_view;

CREATE VIEW public.students_teacher_view WITH (security_barrier = true) AS
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