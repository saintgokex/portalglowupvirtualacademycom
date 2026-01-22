-- Allow task creators to delete their own tasks
CREATE POLICY "Creators can delete own tasks"
ON public.tasks
FOR DELETE
USING (auth.uid() = created_by);

-- Allow users to delete their sent messages
CREATE POLICY "Senders can delete own messages"
ON public.messages
FOR DELETE
USING (auth.uid() = sender_id);