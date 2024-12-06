-- Force email to be nullable using a more direct approach
DO $$ 
BEGIN
    -- Try direct approach first
    BEGIN
        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    EXCEPTION 
        WHEN others THEN
            -- If direct approach fails, try with UPDATE first
            UPDATE users SET email = '' WHERE email IS NULL;
            ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
    END;
END $$; 