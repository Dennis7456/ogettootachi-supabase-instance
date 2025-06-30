-- Fix missing profile for user 71b37539-336f-491c-9a10-b4c0d6e3ad7b
-- This migration manually creates the profile that should have been created by the trigger

-- First, check if the profile already exists
DO $$
DECLARE
    profile_exists BOOLEAN;
    user_metadata JSONB;
BEGIN
    -- Check if profile exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b') INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Get user data from auth.users
        SELECT raw_user_meta_data 
        INTO user_metadata
        FROM auth.users 
        WHERE id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';
        
        -- Insert the profile
        INSERT INTO profiles (
            id,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        ) VALUES (
            '71b37539-336f-491c-9a10-b4c0d6e3ad7b',
            COALESCE(user_metadata->>'full_name', user_metadata->>'first_name', user_metadata->>'last_name', ''),
            COALESCE(user_metadata->>'role', 'admin'),
            true,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Profile created for user 71b37539-336f-491c-9a10-b4c0d6e3ad7b';
    ELSE
        RAISE NOTICE 'Profile already exists for user 71b37539-336f-491c-9a10-b4c0d6e3ad7b';
    END IF;
END $$;

-- Also, let's ensure the trigger is working properly by recreating it
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
    INSERT INTO profiles (id, full_name, role, is_active, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
      true,
      NOW(),
      NOW()
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