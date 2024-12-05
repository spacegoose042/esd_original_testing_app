const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create a new pool using the DATABASE_URL from environment
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function runMigration() {
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations/03_modify_email_constraint.sql');
        const migration = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        await pool.query(migration);
        console.log('Successfully updated email constraint');
    } catch (error) {
        console.error('Error running migration:', error);
        throw error;
    } finally {
        await pool.end();
    }
}

// Run the migration
runMigration().catch(console.error); 