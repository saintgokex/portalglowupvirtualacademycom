-- Fix storage policies to enforce file ownership
-- Teachers should only be able to access their own files, superadmins can access all

-- Drop existing storage policies for reports, notes, and assignments buckets
DROP POLICY IF EXISTS "Teachers can view their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload reports" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view their own notes" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload notes" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view their own assignments" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload assignments" ON storage.objects;

-- Also drop any other existing policies on storage.objects for these buckets
DROP POLICY IF EXISTS "Admins can view all reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all notes" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all assignments" ON storage.objects;

-- REPORTS BUCKET POLICIES
-- Teachers can view only their own reports (using owner column)
CREATE POLICY "Teachers can view own reports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'reports' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- Teachers can upload to reports bucket
CREATE POLICY "Teachers can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'reports' AND 
    (
      public.has_role(auth.uid(), 'teacher'::public.app_role) OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- Teachers can update/delete only their own reports
CREATE POLICY "Teachers can update own reports" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'reports' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

CREATE POLICY "Teachers can delete own reports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'reports' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- NOTES BUCKET POLICIES
-- Teachers can view only their own notes
CREATE POLICY "Teachers can view own notes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'notes' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- Teachers can upload to notes bucket
CREATE POLICY "Teachers can upload notes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'notes' AND 
    (
      public.has_role(auth.uid(), 'teacher'::public.app_role) OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- Teachers can update/delete only their own notes
CREATE POLICY "Teachers can update own notes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'notes' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

CREATE POLICY "Teachers can delete own notes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'notes' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- ASSIGNMENTS BUCKET POLICIES
-- Teachers can view only their own assignments
CREATE POLICY "Teachers can view own assignments" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assignments' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- Teachers can upload to assignments bucket
CREATE POLICY "Teachers can upload assignments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assignments' AND 
    (
      public.has_role(auth.uid(), 'teacher'::public.app_role) OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

-- Teachers can update/delete only their own assignments
CREATE POLICY "Teachers can update own assignments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assignments' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );

CREATE POLICY "Teachers can delete own assignments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assignments' AND 
    (
      owner = auth.uid() OR 
      public.has_role(auth.uid(), 'superadmin'::public.app_role)
    )
  );