-- Create users table first
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create esd_tests table
CREATE TABLE esd_tests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    test_date DATE NOT NULL,
    test_time TIME NOT NULL,
    test_period VARCHAR(20) NOT NULL CHECK (test_period IN ('morning', 'evening')),
    passed BOOLEAN NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create settings table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    morning_deadline TIME NOT NULL DEFAULT '10:00',
    evening_deadline TIME NOT NULL DEFAULT '14:00',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);