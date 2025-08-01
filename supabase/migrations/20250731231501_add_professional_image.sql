-- Add professional_image field to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS professional_image text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.professional_image IS 'URL to professional photo/image of the team member';
