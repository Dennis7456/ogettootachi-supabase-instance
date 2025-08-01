-- Migration: Add accepted_at column to user_invitations
ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ; 