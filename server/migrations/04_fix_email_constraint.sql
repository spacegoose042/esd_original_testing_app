BEGIN;

-- Drop existing constraints on email
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_email_key,
    DROP CONSTRAINT IF EXISTS users_email_unique,
    DROP CONSTRAINT IF EXISTS users_email_not_null;

-- Modify email column to allow NULL
ALTER TABLE users 
    ALTER COLUMN email DROP NOT NULL;

-- Add a conditional unique constraint that only applies when email is not null
ALTER TABLE users 
    ADD CONSTRAINT users_email_unique UNIQUE (email) 
    WHERE email IS NOT NULL;

COMMIT; 