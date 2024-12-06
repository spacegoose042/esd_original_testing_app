const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function forceEmailNullable() {
    const client = await pool.connect();
    try {
        await client.query(`
            DO $$ 
            BEGIN
                -- Try direct approach first
                BEGIN
                    ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
                EXCEPTION 
                    WHEN others THEN
                        -- If direct approach fails, try with UPDATE first
                        UPDATE users SET email = '' WHERE email IS NULL;
                        ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
                END;
            END $$;
        `);
        console.log('Successfully made email nullable');
    } catch (error) {
        console.error('Failed to make email nullable:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

forceEmailNullable(); 