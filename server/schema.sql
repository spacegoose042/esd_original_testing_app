-- Drop existing constraints first
ALTER TABLE users 
    DROP CONSTRAINT IF EXISTS users_email_key,
    DROP CONSTRAINT IF EXISTS users_email_unique;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255),
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create esd_tests table
CREATE TABLE IF NOT EXISTS esd_tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    test_date DATE DEFAULT CURRENT_DATE,
    test_time TIME DEFAULT CURRENT_TIME,
    test_period VARCHAR(50) NOT NULL,
    passed BOOLEAN NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_esd_tests_user_id ON esd_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_esd_tests_date ON esd_tests(test_date); 

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modify users table to add manager relationship and department
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
    ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS manager_email VARCHAR(255);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Insert some default departments
INSERT INTO departments (name) VALUES 
    ('Engineering'),
    ('Production'),
    ('Quality Assurance'),
    ('Maintenance')
ON CONFLICT DO NOTHING;

-- Make sure email and password are nullable
ALTER TABLE users 
    ALTER COLUMN email DROP NOT NULL,
    ALTER COLUMN password DROP NOT NULL;

-- Add unique constraint to email (while allowing NULL)
ALTER TABLE users 
    ADD CONSTRAINT users_email_unique UNIQUE (email);