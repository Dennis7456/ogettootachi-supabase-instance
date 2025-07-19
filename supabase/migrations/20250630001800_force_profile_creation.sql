-- Force profile creation with more robust logic

-- Drop existing trigger and function
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create a more robust trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_id UUID;
  derived_full_name TEXT;
  derived_role TEXT;
BEGIN
  -- Log the trigger execution
  RAISE NOTICE 'Trigger handle_new_user executed for user ID: %', NEW.id;
  
  -- Derive full name from user metadata or email
  derived_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
    NEW.email::TEXT
  );
  
  -- Derive role from user metadata or default to 'user'
  derived_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'user'
  );
  
  -- Always attempt to insert a profile, ignoring conflicts
  INSERT INTO profiles (
    id, 
    full_name, 
    role, 
    is_active
  ) VALUES (
    NEW.id, 
    derived_full_name, 
    derived_role,
    true
  ) ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'Profile created/updated for user ID: % with name: %', NEW.id, derived_full_name;
  
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
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon; 