const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');

// Set timezone to CST
process.env.TZ = 'America/Chicago';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
    } : false,
    // Set timezone for database queries
    query_timeout: 10000,
    statement_timeout: 10000,
    connectionTimeoutMillis: 10000,
    options: '-c timezone=America/Chicago'
});

// Test the connection and timezone
pool.query('SHOW timezone; SELECT NOW();', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
        console.log('Database timezone:', res[0].rows[0].timezone);
        console.log('Current database time:', res[1].rows[0].now);
    }
});

module.exports = pool;