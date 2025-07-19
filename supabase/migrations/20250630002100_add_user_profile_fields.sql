-- Add additional fields to profiles table for comprehensive user information
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS occupation TEXT,
ADD COLUMN IF NOT EXISTS area_of_focus TEXT,
ADD COLUMN IF NOT EXISTS years_of_experience INTEGER,
ADD COLUMN IF NOT EXISTS specializations TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Create a function to update user profile with additional details
CREATE OR REPLACE FUNCTION update_user_profile(
  p_user_id UUID,
  p_occupation TEXT DEFAULT NULL,
  p_area_of_focus TEXT DEFAULT NULL,
  p_years_of_experience INTEGER DEFAULT NULL,
  p_specializations TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    occupation = COALESCE(p_occupation, occupation),
    area_of_focus = COALESCE(p_area_of_focus, area_of_focus),
    years_of_experience = COALESCE(p_years_of_experience, years_of_experience),
    specializations = COALESCE(p_specializations, specializations),
    bio = COALESCE(p_bio, bio)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_user_profile TO service_role;
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile TO anon; 