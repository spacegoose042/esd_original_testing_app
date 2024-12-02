const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'esd_testing_db',
    password: process.env.PGPASSWORD || 'postgres',
    port: process.env.PGPORT || 5432,
    ssl: false
});

module.exports = pool;