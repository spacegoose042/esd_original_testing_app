require('dotenv').config();
const pool = require('../config/db');

async function addActiveStatus() {
    const client = await pool.connect();
    try {
        console.log('Starting active status migration...');
        
        await client.query('BEGIN');

        // Add active column
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
        `);
        console.log('Added is_active column');

        // Update existing users
        await client.query(`
            UPDATE users SET is_active = true WHERE is_active IS NULL
        `);
        console.log('Updated existing users');

        await client.query('COMMIT');
        console.log('Active status migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Active status migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration
addActiveStatus()
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    }); 