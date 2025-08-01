-- Migration: Add invited_by column to user_invitations
ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id); 