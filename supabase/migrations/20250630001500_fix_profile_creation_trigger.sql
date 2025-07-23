-- Fix profile creation trigger to handle more edge cases

-- Drop existing trigger and function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_id UUID;
  derived_first_name TEXT;
  derived_last_name TEXT;
  derived_role TEXT;
  raw_metadata JSONB;
  email_username TEXT;
  existing_profile_count INTEGER;
  log_message TEXT;
BEGIN
  -- Log the trigger execution with more details
  RAISE NOTICE 'Trigger handle_new_user executed for user ID: %, Email: %, Raw Metadata: %', 
    NEW.id, NEW.email, NEW.raw_user_meta_data::TEXT;
  
  -- Safely parse raw metadata
  raw_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  
  -- Extract username from email if no name is provided
  email_username := SPLIT_PART(NEW.email, '@', 1);
  
  -- Derive first and last name from user metadata or email
  derived_first_name := COALESCE(
    NULLIF(TRIM(raw_metadata->>'first_name'), ''),
    NULLIF(TRIM(SPLIT_PART(COALESCE(raw_metadata->>'full_name', email_username), ' ', 1)), '')
  );
  
  derived_last_name := COALESCE(
    NULLIF(TRIM(raw_metadata->>'last_name'), ''),
    NULLIF(TRIM(REPLACE(COALESCE(raw_metadata->>'full_name', email_username), derived_first_name, '')), '')
  );
  
  -- Fallback to email username if no name is found
  derived_first_name := COALESCE(derived_first_name, email_username);
  
  -- Derive role from user metadata or default to 'user'
  derived_role := COALESCE(
    NULLIF(TRIM(raw_metadata->>'role'), ''),
    'user'
  );
  
  -- Truncate names to prevent database errors
  derived_first_name := SUBSTRING(derived_first_name FROM 1 FOR 50);
  derived_last_name := SUBSTRING(derived_last_name FROM 1 FOR 50);
  
  -- Check if profile already exists
  BEGIN
    SELECT COUNT(*) INTO existing_profile_count 
    FROM profiles 
    WHERE id = NEW.id;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE WARNING 'Error checking existing profile: %', SQLERRM;
      existing_profile_count := 0;
  END;
  
  -- Insert or update profile only if it doesn't exist
  IF existing_profile_count = 0 THEN
    BEGIN
      -- Insert new profile with derived information
      INSERT INTO profiles (
        id, 
        first_name, 
        last_name,
        role, 
        is_active,
        email
      ) VALUES (
        NEW.id, 
        derived_first_name, 
        derived_last_name,
        derived_role,
        true,
        NEW.email
      ) ON CONFLICT (id) DO NOTHING;
      
      -- Prepare log message
      log_message := FORMAT(
        'Profile created for user ID: %s with name: %s %s and role: %s', 
        NEW.id, derived_first_name, derived_last_name, derived_role
      );
      
      RAISE NOTICE '%', log_message;
    EXCEPTION
      WHEN OTHERS THEN
        -- Detailed error logging
        RAISE WARNING 'Failed to create profile for user %: %, Metadata: %, Derived First Name: %, Derived Last Name: %, Derived Role: %', 
          NEW.id, SQLERRM, raw_metadata::TEXT, derived_first_name, derived_last_name, derived_role;
    END;
  ELSE
    RAISE NOTICE 'Profile already exists for user ID: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Unexpected error in handle_new_user for user %: %', NEW.id, SQLERRM;
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
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon; 