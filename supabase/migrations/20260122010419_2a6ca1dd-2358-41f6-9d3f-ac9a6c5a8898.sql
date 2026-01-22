-- Fix 1: Allow students to view their own files in storage buckets

-- Students can view their own reports
CREATE POLICY "Students can view own reports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'reports' AND
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.file_path = name
    AND public.is_student_user(auth.uid(), r.student_id)
  )
);

-- Students can view their own notes
CREATE POLICY "Students can view own notes"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'notes' AND
  EXISTS (
    SELECT 1 FROM public.notes n
    WHERE n.file_path = name
    AND public.is_student_user(auth.uid(), n.student_id)
  )
);

-- Students can view their own assignments
CREATE POLICY "Students can view own assignments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'assignments' AND
  EXISTS (
    SELECT 1 FROM public.assignments a
    WHERE a.file_path = name
    AND public.is_student_user(auth.uid(), a.student_id)
  )
);

-- Fix 2: Allow superadmins to view messages with null recipient_id
DROP POLICY "Users can view own messages" ON public.messages;

CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id OR
  (recipient_id IS NULL AND public.has_role(auth.uid(), 'superadmin'))
);