-- Add required fields for user invitations
ALTER TABLE profiles ADD COLUMN title text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN phone text NOT NULL DEFAULT '';
ALTER TABLE profiles ADD COLUMN bio text NOT NULL DEFAULT '';