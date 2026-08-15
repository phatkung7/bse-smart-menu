-- Add tester_id column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS tester_id TEXT;
