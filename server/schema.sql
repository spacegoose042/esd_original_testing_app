-- Drop existing tables
DROP TABLE IF EXISTS esd_tests;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    is_admin BOOLEAN DEFAULT false,
    is_manager BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    department_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_unique UNIQUE (email),
    -- Email and password are required only for admin and manager users
    CONSTRAINT check_admin_manager_credentials CHECK (
        (is_admin = false AND is_manager = false) OR 
        (email IS NOT NULL AND password_hash IS NOT NULL)
    )
);

-- Create esd_tests table
CREATE TABLE esd_tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    test_date DATE DEFAULT CURRENT_DATE,
    test_time TIME DEFAULT CURRENT_TIME,
    test_period VARCHAR(20) NOT NULL CHECK (test_period IN ('AM', 'PM')),
    passed BOOLEAN NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_esd_tests_user_id ON esd_tests(user_id);
CREATE INDEX idx_esd_tests_date ON esd_tests(test_date);
CREATE INDEX idx_users_department_id ON users(department_id);

-- Add foreign key for department
ALTER TABLE users 
    ADD CONSTRAINT fk_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id);

-- Insert default departments
INSERT INTO departments (name) VALUES 
    ('Engineering'),
    ('Production'),
    ('Quality Assurance'),
    ('Maintenance')
ON CONFLICT DO NOTHING;