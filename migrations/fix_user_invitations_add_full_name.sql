-- Migration: Add full_name column to user_invitations
ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS full_name TEXT; 