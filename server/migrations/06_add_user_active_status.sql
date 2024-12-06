-- Start transaction
BEGIN;

-- Add active column to users table with default true
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing users to be active
UPDATE users SET is_active = true WHERE is_active IS NULL;

COMMIT; 