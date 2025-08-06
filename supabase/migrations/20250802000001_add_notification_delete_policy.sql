-- Add DELETE policy for notifications table
-- This allows users to delete their own notifications

-- Drop policy if it exists
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can delete their own notifications" 
ON notifications FOR DELETE 
USING (auth.uid() = user_id); 