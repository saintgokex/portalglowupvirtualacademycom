-- Fix storage policy - drop if exists first
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;

CREATE POLICY "Students can upload submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' 
  AND has_role(auth.uid(), 'student'::app_role)
);