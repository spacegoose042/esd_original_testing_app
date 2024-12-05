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
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT departments_name_unique UNIQUE (name)
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
                user_id INTEGER REFERENCES users(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT managers_user_id_unique UNIQUE (user_id),
                CONSTRAINT managers_email_unique UNIQUE (email)
            );
        `;
        console.log('Creating managers table...');
        await client.query(createManagersSQL);

        // Step 4: Insert departments
        const insertDepartmentsSQL = `
            INSERT INTO departments (name) 
            VALUES 
                ('Engineering'),
                ('Production'),
                ('Quality Assurance'),
                ('Maintenance')
            ON CONFLICT ON CONSTRAINT departments_name_unique DO NOTHING;
        `;
        console.log('Inserting departments...');
        await client.query(insertDepartmentsSQL);

        // Step 5: Migrate manager data
        const migrateManagersSQL = `
            -- First, ensure all existing managers are properly marked
            UPDATE users 
            SET is_manager = true 
            WHERE id IN (SELECT user_id FROM managers);

            -- Then insert any missing manager records
            INSERT INTO managers (first_name, last_name, email, department_id, user_id)
            SELECT 
                first_name,
                last_name,
                email,
                department_id,
                id
            FROM users
            WHERE is_manager = true
            AND id NOT IN (SELECT user_id FROM managers WHERE user_id IS NOT NULL)
            ON CONFLICT ON CONSTRAINT managers_user_id_unique 
            DO UPDATE SET
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                email = EXCLUDED.email,
                department_id = EXCLUDED.department_id;

            -- Update the admin user specifically
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
            ON CONFLICT ON CONSTRAINT managers_user_id_unique 
            DO UPDATE SET
                email = EXCLUDED.email,
                department_id = EXCLUDED.department_id;
        `;
        
        console.log('Migrating manager data...');
        await client.query(migrateManagersSQL);

        // Step 6: Create indexes
        const createIndexesSQL = `
            CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_department_id ON managers(department_id);
            CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
        `;
        console.log('Creating indexes...');
        await client.query(createIndexesSQL);

        console.log('Database schema updated successfully');
        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
};

initializeDb().catch(console.error);

module.exports = pool;