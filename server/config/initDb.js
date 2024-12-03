const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
    try {
        // Read the schema file
        const schema = fs.readFileSync(path.join(__dirname, '../schema.sql'), 'utf8');
        
        // Execute the schema
        await pool.query(schema);
        console.log('Database schema initialized successfully');

        // Create admin user if it doesn't exist
        const adminEmail = 'admin@example.com';
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
        
        if (result.rows.length === 0) {
            await pool.query(`
                INSERT INTO users (first_name, last_name, email, password, is_admin)
                VALUES ($1, $2, $3, $4, $5)
            `, ['Admin', 'User', adminEmail, '$2a$10$your_hashed_password', true]);
            console.log('Admin user created');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = initializeDatabase; 