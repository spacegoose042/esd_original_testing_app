require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

// Add migration function
async function runEmailMigration() {
    const client = await pool.connect();
    try {
        console.log('Starting email constraint migration...');
        
        await client.query('BEGIN');

        // Drop existing constraints
        await client.query(`
            ALTER TABLE users 
            DROP CONSTRAINT IF EXISTS users_email_key,
            DROP CONSTRAINT IF EXISTS users_email_unique,
            DROP CONSTRAINT IF EXISTS users_email_not_null;
        `);

        // Modify email column to allow NULL
        await client.query(`
            ALTER TABLE users 
            ALTER COLUMN email DROP NOT NULL;
        `);

        // Add conditional unique constraint
        await client.query(`
            ALTER TABLE users 
            ADD CONSTRAINT users_email_unique UNIQUE (email) 
            WHERE email IS NOT NULL;
        `);

        await client.query('COMMIT');
        console.log('Email migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Email migration failed:', error);
        // Don't throw error - allow server to start anyway
    } finally {
        client.release();
    }
}

const app = express();

// Configure CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://esdoriginaltestingapp-production.up.railway.app'
        : 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/debug', require('./routes/debug'));

// Serve static files from the React app
const staticPath = path.join(__dirname, '../client/dist');

// Set proper MIME types
app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=UTF-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        }
    }
}));

// Handle client-side routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Initialize server
async function startServer() {
    try {
        // Run migration before starting server
        await runEmailMigration();
        
        pool.query('SELECT NOW()', (err) => {
            if (err) {
                console.error('Error connecting to database:', err);
                process.exit(1);
            }
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
                console.log('Environment:', process.env.NODE_ENV);
                console.log('Database connected');
            });
        });
    } catch (err) {
        console.error('Server startup error:', err);
        process.exit(1);
    }
}

// Start server
startServer();