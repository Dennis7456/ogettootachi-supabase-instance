-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Create a function to automatically set email from auth.users
CREATE OR REPLACE FUNCTION public.set_email_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Try to set email from auth.users if not already set
  IF NEW.email IS NULL THEN
    SELECT email INTO NEW.email 
    FROM auth.users 
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set email
CREATE TRIGGER set_profile_email
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_email_from_auth(); 