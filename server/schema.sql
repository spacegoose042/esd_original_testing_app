-- Drop and recreate the users table
DROP TABLE IF EXISTS esd_tests;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct constraints from the start
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NULL,
    password VARCHAR(255) NULL,
    is_admin BOOLEAN DEFAULT false,
    is_manager BOOLEAN DEFAULT false,
    manager_id INTEGER,
    department_id INTEGER,
    manager_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create esd_tests table
CREATE TABLE esd_tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    test_date DATE DEFAULT CURRENT_DATE,
    test_time TIME DEFAULT CURRENT_TIME,
    test_period VARCHAR(50) NOT NULL,
    passed BOOLEAN NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_esd_tests_user_id ON esd_tests(user_id);
CREATE INDEX idx_esd_tests_date ON esd_tests(test_date);
CREATE INDEX idx_users_manager_id ON users(manager_id);
CREATE INDEX idx_users_department_id ON users(department_id);

-- Add foreign key constraints
ALTER TABLE users 
    ADD CONSTRAINT fk_users_manager 
    FOREIGN KEY (manager_id) REFERENCES users(id);

ALTER TABLE users 
    ADD CONSTRAINT fk_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id);

-- Add unique constraint to email (while allowing NULL)
ALTER TABLE users 
    ADD CONSTRAINT users_email_unique UNIQUE (email) WHERE email IS NOT NULL;

-- Insert default departments
INSERT INTO departments (name) VALUES 
    ('Engineering'),
    ('Production'),
    ('Quality Assurance'),
    ('Maintenance')
ON CONFLICT DO NOTHING;