require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false
});

async function runMigration(filename) {
    const client = await pool.connect();
    try {
        console.log(`Running migration: ${filename}`);
        
        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations', filename);
        const migration = await fs.readFile(migrationPath, 'utf8');
        
        // Start transaction
        await client.query('BEGIN');
        
        // Run the migration
        await client.query(migration);
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`Migration ${filename} completed successfully`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Migration ${filename} failed:`, error);
        throw error;
    } finally {
        client.release();
    }
}

// Get migration filename from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
    console.error('Please provide a migration filename');
    process.exit(1);
}

// Run the migration
runMigration(migrationFile)
    .then(() => {
        console.log('Migration completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    }); 