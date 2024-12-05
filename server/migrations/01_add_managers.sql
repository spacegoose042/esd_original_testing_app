-- Start transaction to ensure all changes are atomic
BEGIN;

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id),
    ADD COLUMN IF NOT EXISTS is_manager BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS manager_email VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Insert default departments
INSERT INTO departments (name) VALUES 
    ('Engineering'),
    ('Production'),
    ('Quality Assurance'),
    ('Maintenance')
ON CONFLICT DO NOTHING;

-- Update existing admin user to be a manager
UPDATE users 
SET is_manager = true,
    department_id = (SELECT id FROM departments WHERE name = 'Engineering')
WHERE email = 'matt.miers@sandyindustries.com';

-- Commit transaction
COMMIT; 