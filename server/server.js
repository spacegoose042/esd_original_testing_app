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

        // Drop only email-related constraints
        await client.query(`
            DO $$ 
            BEGIN
                -- Drop email constraints
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_unique;
                ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_not_null;
            EXCEPTION 
                WHEN others THEN 
                    -- Log error but continue
                    RAISE NOTICE 'Error dropping constraints: %', SQLERRM;
            END $$;
        `);
        console.log('Attempted to drop email constraints');

        // Try to modify email column directly
        await client.query(`
            DO $$ 
            BEGIN
                -- First attempt: try direct ALTER COLUMN
                ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
            EXCEPTION 
                WHEN others THEN
                    -- If direct approach fails, try with a temporary column
                    ALTER TABLE users ADD COLUMN temp_email VARCHAR(255);
                    UPDATE users SET temp_email = email;
                    ALTER TABLE users DROP COLUMN email;
                    ALTER TABLE users RENAME COLUMN temp_email TO email;
            END $$;
        `);
        console.log('Modified email column');

        // Add new email unique constraint that allows nulls
        await client.query(`
            ALTER TABLE users ADD CONSTRAINT users_email_unique 
                UNIQUE (email) 
                WHERE email IS NOT NULL AND email != '';
        `);
        console.log('Added new email constraint');

        await client.query('COMMIT');
        console.log('Email migration completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Email migration failed:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            hint: error.hint,
            position: error.position
        });
    } finally {
        client.release();
    }
}

// Add this near the top with other initialization code
async function makeEmailNullable() {
    const client = await pool.connect();
    try {
        console.log('Attempting to make email nullable...');
        await client.query(`
            DO $$ 
            BEGIN
                -- First try to drop the not null constraint
                ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
            EXCEPTION 
                WHEN others THEN
                    RAISE NOTICE 'Could not drop not null constraint: %', SQLERRM;
            END $$;
        `);
        console.log('Email column modification attempted');
    } catch (error) {
        console.error('Failed to modify email column:', error);
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

// API routes first
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/debug', require('./routes/debug'));

const staticPath = path.join(__dirname, '../client/dist');

// Explicitly handle assets with correct MIME types
app.get('/assets/*', (req, res, next) => {
    const assetPath = path.join(staticPath, req.path);
    console.log('Asset request:', {
        requestPath: req.path,
        fullPath: assetPath
    });

    // Set MIME types explicitly
    const ext = path.extname(assetPath);
    switch (ext) {
        case '.js':
            res.set('Content-Type', 'application/javascript');
            break;
        case '.css':
            res.set('Content-Type', 'text/css');
            break;
        case '.png':
            res.set('Content-Type', 'image/png');
            break;
        case '.svg':
            res.set('Content-Type', 'image/svg+xml');
            break;
        case '.json':
            res.set('Content-Type', 'application/json');
            break;
    }

    res.sendFile(assetPath, (err) => {
        if (err) {
            console.error('Error serving asset:', {
                path: assetPath,
                error: err.message
            });
            next(err);
        }
    });
});

// Serve static files
app.use(express.static(staticPath));

// Handle client-side routing
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        res.status(404).json({ error: 'API endpoint not found' });
        return;
    }
    res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Initialize server
async function startServer() {
    try {
        // Try to make email nullable before starting server
        await makeEmailNullable();
        
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