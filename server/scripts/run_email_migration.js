const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting email constraint migration...');
        
        await client.query('BEGIN');

        // Drop existing constraints
        await client.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS users_email_key,
            DROP CONSTRAINT IF EXISTS users_email_unique,
            DROP CONSTRAINT IF EXISTS users_email_not_null;
        `);
        console.log('Dropped existing constraints');

        // Modify email column to allow NULL
        await client.query(`
            ALTER TABLE users 
            ALTER COLUMN email DROP NOT NULL;
        `);
        console.log('Modified email column to allow NULL');

        // Add conditional unique constraint
        await client.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_email_unique UNIQUE (email) 
            WHERE email IS NOT NULL;
        `);
        console.log('Added new conditional unique constraint');

        await client.query('COMMIT');
        console.log('Migration completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
runMigration()
    .then(() => {
        console.log('Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    }); 