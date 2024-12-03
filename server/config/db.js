const { Pool } = require('pg');

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
        console.log('Successfully connected to database');

        // Create tables if they don't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_admin BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS esd_tests (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                test_date DATE DEFAULT CURRENT_DATE,
                test_time TIME DEFAULT CURRENT_TIME,
                test_period VARCHAR(50) NOT NULL,
                passed BOOLEAN NOT NULL,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_esd_tests_user_id ON esd_tests(user_id);
            CREATE INDEX IF NOT EXISTS idx_esd_tests_date ON esd_tests(test_date);
        `);
        console.log('Database tables initialized');

        client.release();
    } catch (err) {
        console.error('Database initialization error:', err);
        throw err;
    }
};

initializeDb();

module.exports = pool;