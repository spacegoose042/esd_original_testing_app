-- Start transaction
BEGIN;

-- Drop existing constraints on email
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_email_key,
    DROP CONSTRAINT IF EXISTS users_email_unique;

-- Drop NOT NULL constraint on email and password
ALTER TABLE users 
    ALTER COLUMN email DROP NOT NULL,
    ALTER COLUMN password DROP NOT NULL;

-- Add new unique constraint that allows NULL values
ALTER TABLE users 
    ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Commit transaction
COMMIT; 