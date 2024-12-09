-- Start transaction
BEGIN;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        -- Add the column
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Set existing users to active
        UPDATE users SET is_active = true WHERE is_active IS NULL;
    END IF;
END $$;

COMMIT; 