require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const pool = require('../config/db');

async function addIsActiveColumn() {
    const client = await pool.connect();
    try {
        console.log('Starting is_active column migration...');
        
        // Read the migration file
        const migrationPath = path.join(__dirname, '../migrations/07_add_is_active_column.sql');
        const migration = await fs.readFile(migrationPath, 'utf8');
        
        // Execute the migration
        await client.query(migration);
        
        // Verify the column was added
        const result = await client.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users' AND column_name = 'is_active'
        `);
        
        if (result.rows.length > 0) {
            console.log('is_active column details:', result.rows[0]);
            console.log('Migration completed successfully');
        } else {
            throw new Error('Column was not added successfully');
        }
        
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run the migration
addIsActiveColumn()
    .then(() => {
        console.log('Migration script completed');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    }); 