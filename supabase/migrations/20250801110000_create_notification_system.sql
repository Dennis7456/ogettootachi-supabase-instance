-- Create notifications system
-- This includes the notifications table and related functions

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb DEFAULT '{}',
    read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON notifications FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications for any user" 
ON notifications FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'staff')
    )
);

CREATE POLICY "Service role can manage all notifications" 
ON notifications FOR ALL 
USING (auth.role() = 'service_role');

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
    target_user_id uuid,
    notification_type text,
    notification_title text,
    notification_message text,
    notification_data jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    notification_id uuid;
BEGIN
    -- Insert the notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
    user_uuid uuid,
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0
)
RETURNS TABLE (
    id uuid,
    type text,
    title text,
    message text,
    data jsonb,
    read boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.data,
        n.read,
        n.created_at,
        n.updated_at
    FROM notifications n
    WHERE n.user_id = user_uuid
    ORDER BY n.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
    user_uuid uuid,
    notification_ids uuid[] DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_updated integer;
BEGIN
    -- If specific notification IDs are provided, mark only those
    IF notification_ids IS NOT NULL THEN
        UPDATE notifications 
        SET read = true, updated_at = now()
        WHERE user_id = user_uuid 
        AND id = ANY(notification_ids)
        AND read = false;
    ELSE
        -- Mark all unread notifications as read
        UPDATE notifications 
        SET read = true, updated_at = now()
        WHERE user_id = user_uuid 
        AND read = false;
    END IF;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    user_uuid uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    unread_count integer;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM notifications
    WHERE user_id = user_uuid AND read = false;
    
    RETURN COALESCE(unread_count, 0);
END;
$$;

-- Function to delete old notifications (cleanup)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(
    days_old integer DEFAULT 90
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_deleted integer;
BEGIN
    DELETE FROM notifications
    WHERE created_at < (now() - interval '1 day' * days_old);
    
    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at 
BEFORE UPDATE ON notifications 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION create_notification(uuid, text, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_notification_count(uuid) TO authenticated;