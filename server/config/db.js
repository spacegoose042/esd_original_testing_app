const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test and initialize the connection
const initializeDb = async () => {
    try {
        const client = await pool.connect();
        console.log('Starting database initialization...');

        // Read and execute the migration SQL
        const migrationSQL = `
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

            -- Create managers table
            CREATE TABLE IF NOT EXISTS managers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                department_id INTEGER REFERENCES departments(id),
                user_id INTEGER REFERENCES users(id) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_managers_department_id ON managers(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_user_id ON managers(user_id);

            -- Insert admin as manager if not exists
            INSERT INTO managers (first_name, last_name, department_id, user_id)
            SELECT 
                first_name,
                last_name,
                department_id,
                id as user_id
            FROM users 
            WHERE email = 'matt.miers@sandyindustries.com'
            ON CONFLICT (user_id) DO NOTHING;
        `;

        console.log('Executing database migrations...');
        await client.query(migrationSQL);
        console.log('Database schema updated successfully');

        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
};

initializeDb().catch(console.error);

module.exports = pool;