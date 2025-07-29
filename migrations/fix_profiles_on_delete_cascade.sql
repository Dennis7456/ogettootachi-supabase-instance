-- Migration: Add ON DELETE CASCADE to profiles.id foreign key

-- 1. Drop the existing foreign key constraint (if it exists)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE profiles
ADD CONSTRAINT profiles_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE; 