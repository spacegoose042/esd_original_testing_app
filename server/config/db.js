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
                name VARCHAR(100) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

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
        `);

        // Step 2: Insert departments
        await client.query(`
            INSERT INTO departments (name) 
            VALUES 
                ('Engineering'),
                ('Production'),
                ('Quality Assurance'),
                ('Maintenance')
            ON CONFLICT (name) DO NOTHING;
        `);

        // Step 3: Create managers table without email initially
        await client.query(`
            CREATE TABLE IF NOT EXISTS managers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                department_id INTEGER REFERENCES departments(id),
                user_id INTEGER REFERENCES users(id) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Step 4: Add email column to managers table
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'managers' AND column_name = 'email'
                ) THEN
                    ALTER TABLE managers ADD COLUMN email VARCHAR(255);
                END IF;
            END $$;
        `);

        // Step 5: Copy emails from users to managers
        await client.query(`
            WITH manager_emails AS (
                SELECT u.id, u.email
                FROM users u
                WHERE u.is_manager = true
            )
            UPDATE managers m
            SET email = me.email
            FROM manager_emails me
            WHERE m.user_id = me.id;
        `);

        // Step 6: Make email NOT NULL after data is copied
        await client.query(`
            ALTER TABLE managers 
            ALTER COLUMN email SET NOT NULL,
            ADD CONSTRAINT managers_email_unique UNIQUE (email);
        `);

        // Step 7: Create indexes
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_department_id ON managers(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
        `);

        // Step 8: Ensure admin user is properly set up
        await client.query(`
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
            ON CONFLICT (user_id) DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email = EXCLUDED.email,
                department_id = EXCLUDED.department_id;
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