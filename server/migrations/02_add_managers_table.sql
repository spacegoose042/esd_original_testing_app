-- Start transaction
BEGIN;

-- Create managers table
CREATE TABLE IF NOT EXISTS managers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department_id INTEGER REFERENCES departments(id),
    user_id INTEGER REFERENCES users(id) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_managers_department_id ON managers(department_id);
CREATE INDEX IF NOT EXISTS idx_managers_user_id ON managers(user_id);

-- Migrate existing managers from users table
INSERT INTO managers (first_name, last_name, department_id, user_id)
SELECT 
    first_name,
    last_name,
    department_id,
    id as user_id
FROM users 
WHERE is_manager = true
ON CONFLICT (user_id) DO NOTHING;

COMMIT; 