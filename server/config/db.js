const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Successfully connected to database');
    release();
});

module.exports = pool;