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
        `);

        // Step 2: Insert departments one by one
        const departments = ['Engineering', 'Production', 'Quality Assurance', 'Maintenance'];
        for (const dept of departments) {
            await client.query(`
                INSERT INTO departments (name)
                SELECT $1
                WHERE NOT EXISTS (
                    SELECT 1 FROM departments WHERE name = $1
                );
            `, [dept]);
        }

        // Step 3: Create or modify managers table
        await client.query(`
            -- Drop existing managers table if it exists
            DROP TABLE IF EXISTS managers;

            -- Create new managers table with email
            CREATE TABLE managers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                department_id INTEGER REFERENCES departments(id),
                user_id INTEGER REFERENCES users(id) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            -- Create unique constraint on email
            CREATE UNIQUE INDEX idx_managers_email ON managers(email);
        `);

        // Step 4: Migrate manager data
        await client.query(`
            -- Insert manager records from users
            INSERT INTO managers (first_name, last_name, email, department_id, user_id)
            SELECT 
                first_name,
                last_name,
                email,
                department_id,
                id
            FROM users
            WHERE is_manager = true;

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

        // Step 5: Create remaining indexes
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