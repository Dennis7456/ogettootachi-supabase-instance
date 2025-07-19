-- Create or replace the update_user_profile function
CREATE OR REPLACE FUNCTION public.update_user_profile(
  p_user_id UUID,
  p_occupation TEXT DEFAULT NULL,
  p_area_of_focus TEXT DEFAULT NULL,
  p_years_of_experience INTEGER DEFAULT NULL,
  p_specializations TEXT DEFAULT NULL,
  p_bio TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update the profiles table with the new information
  UPDATE public.profiles
  SET 
    occupation = COALESCE(p_occupation, occupation),
    area_of_focus = COALESCE(p_area_of_focus, area_of_focus),
    years_of_experience = COALESCE(p_years_of_experience, years_of_experience),
    specializations = COALESCE(p_specializations, specializations),
    bio = COALESCE(p_bio, bio),
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Ensure at least one row is affected
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found for ID: %', p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT, INTEGER, TEXT, TEXT) TO anon; 