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

const initializeDb = async () => {
    try {
        const client = await pool.connect();
        console.log('Starting database initialization...');

        // Step 1: Create base tables
        await client.query(`
            -- Create departments table
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Create unique index for department names
            CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

            -- Create users table
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                first_name VARCHAR(100),
                last_name VARCHAR(100),
                is_manager BOOLEAN DEFAULT false,
                department_id INTEGER REFERENCES departments(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Create managers table if it doesn't exist
            CREATE TABLE IF NOT EXISTS managers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                department_id INTEGER REFERENCES departments(id),
                user_id INTEGER REFERENCES users(id) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Step 2: Add email column to managers table if it doesn't exist
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 
                    FROM information_schema.columns 
                    WHERE table_name = 'managers' 
                    AND column_name = 'email'
                ) THEN
                    ALTER TABLE managers ADD COLUMN email VARCHAR(255);
                END IF;
            END $$;
        `);

        // Step 3: Insert departments
        const departments = ['Engineering', 'Production', 'Quality Assurance', 'Maintenance'];
        for (const dept of departments) {
            await client.query(`
                INSERT INTO departments (name)
                SELECT $1::VARCHAR(100)
                WHERE NOT EXISTS (
                    SELECT 1 FROM departments WHERE name = $1::VARCHAR(100)
                );
            `, [dept]);
        }

        // Step 4: Update existing manager records with email
        await client.query(`
            -- Update existing manager records with email from users table
            UPDATE managers m
            SET email = u.email
            FROM users u
            WHERE m.user_id = u.id
            AND (m.email IS NULL OR m.email = '');

            -- Insert new manager records
            INSERT INTO managers (first_name, last_name, email, department_id, user_id)
            SELECT 
                first_name,
                last_name,
                email,
                department_id,
                id
            FROM users
            WHERE is_manager = true
            AND id NOT IN (SELECT user_id FROM managers WHERE user_id IS NOT NULL);

            -- Ensure admin user is set up
            WITH admin_update AS (
                UPDATE users 
                SET 
                    is_manager = true,
                    department_id = (SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1)
                WHERE email = 'matt.miers@sandyindustries.com'
                RETURNING id, first_name, last_name, email, department_id
            )
            INSERT INTO managers (first_name, last_name, email, department_id, user_id)
            SELECT 
                first_name,
                last_name,
                email,
                department_id,
                id
            FROM admin_update
            WHERE NOT EXISTS (
                SELECT 1 FROM managers WHERE user_id = admin_update.id
            );
        `);

        // Step 5: Now that data is migrated, add NOT NULL constraint
        await client.query(`
            -- First verify all emails are populated
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM managers WHERE email IS NULL OR email = ''
                ) THEN
                    ALTER TABLE managers ALTER COLUMN email SET NOT NULL;
                    ALTER TABLE managers ADD CONSTRAINT managers_email_unique UNIQUE (email);
                END IF;
            END $$;
        `);

        // Step 6: Create remaining indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_department_id ON managers(department_id);
        `);

        console.log('Database schema updated successfully');
        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
};

initializeDb().catch(console.error);

module.exports = pool;