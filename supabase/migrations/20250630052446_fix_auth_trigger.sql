-- Fix auth trigger to automatically create user profiles
-- This ensures that when users sign up, their profile is automatically created

-- Drop and recreate the trigger function with SECURITY DEFINER
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_id UUID;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger handle_new_user executed for user ID: %', NEW.id;
  
  -- Check if profile already exists
  SELECT id INTO profile_id FROM profiles WHERE id = NEW.id;
  
  IF profile_id IS NULL THEN
    -- Insert new profile
    INSERT INTO profiles (id, first_name, last_name, role)
    VALUES (
      NEW.id, 
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    );
    
    RAISE NOTICE 'Profile created for user ID: %', NEW.id;
  ELSE
    RAISE NOTICE 'Profile already exists for user ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO postgres;
