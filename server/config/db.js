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

        // Step 1: Create departments table
        const createDepartmentsSQL = `
            CREATE TABLE IF NOT EXISTS departments (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log('Creating departments table...');
        await client.query(createDepartmentsSQL);

        // Step 2: Create users table
        const createUsersSQL = `
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
        `;
        console.log('Creating users table...');
        await client.query(createUsersSQL);

        // Step 3: Create managers table
        const createManagersSQL = `
            CREATE TABLE IF NOT EXISTS managers (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL,
                department_id INTEGER REFERENCES departments(id),
                user_id INTEGER REFERENCES users(id) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log('Creating managers table...');
        await client.query(createManagersSQL);

        // Step 4: Create basic indexes (excluding email for now)
        const createBasicIndexesSQL = `
            CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_department_id ON managers(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_user_id ON managers(user_id);
        `;
        console.log('Creating basic indexes...');
        await client.query(createBasicIndexesSQL);

        // Step 5: Verify managers table structure and create email index
        const verifyAndCreateEmailIndexSQL = `
            DO $$
            BEGIN
                -- Check if the email column exists
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'managers'
                    AND column_name = 'email'
                ) THEN
                    -- Create the email index only if the column exists
                    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email)';
                END IF;
            END $$;
        `;
        console.log('Verifying managers table and creating email index...');
        await client.query(verifyAndCreateEmailIndexSQL);

        // Step 6: Insert departments
        const insertDepartmentsSQL = `
            INSERT INTO departments (name) 
            VALUES 
                ('Engineering'),
                ('Production'),
                ('Quality Assurance'),
                ('Maintenance')
            ON CONFLICT (name) DO NOTHING;
        `;
        console.log('Inserting departments...');
        await client.query(insertDepartmentsSQL);

        // Step 7: Update admin user
        const updateAdminSQL = `
            WITH updated_user AS (
                UPDATE users 
                SET 
                    is_manager = true,
                    department_id = (
                        SELECT id FROM departments WHERE name = 'Engineering' LIMIT 1
                    )
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
            FROM updated_user
            ON CONFLICT (user_id) 
            DO UPDATE SET
                email = EXCLUDED.email,
                department_id = EXCLUDED.department_id;
        `;
        console.log('Updating admin user...');
        await client.query(updateAdminSQL);

        console.log('Database schema updated successfully');
        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
};

initializeDb().catch(console.error);

module.exports = pool;