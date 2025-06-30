-- Create function to log invitation creation and prepare for email sending
CREATE OR REPLACE FUNCTION log_invitation_creation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_url TEXT;
BEGIN
  -- Construct invitation URL
  invitation_url := 'http://127.0.0.1:5173/admin/invite?token=' || NEW.invitation_token;
  
  -- Log the invitation creation with all details needed for email
  RAISE NOTICE 'New invitation created for email: %, role: %, token: %, URL: %', 
    NEW.email, NEW.role, NEW.invitation_token, invitation_url;
  
  -- Store invitation details in a way that can be accessed by the frontend
  -- The frontend can query this information and send emails accordingly
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log when invitation is created
DROP TRIGGER IF EXISTS trigger_log_invitation_creation ON user_invitations;
CREATE TRIGGER trigger_log_invitation_creation
  AFTER INSERT ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION log_invitation_creation();

-- Add Resend API key to settings (you'll need to set this manually)
-- ALTER DATABASE postgres SET "app.resend_api_key" = 'your_resend_api_key_here'; 