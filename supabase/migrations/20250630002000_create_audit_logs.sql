-- Create audit_logs table for comprehensive user activity tracking
CREATE TYPE audit_action_type AS ENUM (
  'login',
  'logout',
  'user_created',
  'user_updated',
  'user_deleted',
  'role_changed',
  'profile_viewed',
  'password_changed',
  'invitation_sent',
  'invitation_accepted',
  'file_uploaded',
  'file_accessed'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action audit_action_type NOT NULL,
  
  -- Contextual details
  target_user_id UUID,  -- User being acted upon (if applicable)
  old_value JSONB,      -- Previous state (for updates)
  new_value JSONB,      -- New state (for updates)
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional additional context
  description TEXT,
  additional_info JSONB
);

-- Create an index for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  p_user_id UUID,
  p_actor_id UUID,
  p_action audit_action_type,
  p_target_user_id UUID DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL,
  p_new_value JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_additional_info JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    user_id, 
    actor_id, 
    action, 
    target_user_id,
    old_value, 
    new_value,
    ip_address,
    user_agent,
    description,
    additional_info
  ) VALUES (
    p_user_id,
    p_actor_id,
    p_action,
    p_target_user_id,
    p_old_value,
    p_new_value,
    p_ip_address,
    p_user_agent,
    p_description,
    p_additional_info
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION log_audit_event TO service_role;
GRANT EXECUTE ON FUNCTION log_audit_event TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit_event TO anon;

-- Trigger for automatic audit logging on user updates
CREATE OR REPLACE FUNCTION trigger_user_update_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    PERFORM log_audit_event(
      p_user_id := NEW.id,
      p_actor_id := auth.uid(),
      p_action := 'role_changed',
      p_old_value := jsonb_build_object('role', OLD.role),
      p_new_value := jsonb_build_object('role', NEW.role),
      p_description := 'User role updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
CREATE TRIGGER user_update_audit_trigger
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_user_update_audit(); 