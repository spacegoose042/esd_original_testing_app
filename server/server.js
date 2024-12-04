require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// API routes first
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/users', require('./routes/users'));

// Add debug logging for API requests
app.use('/api', (req, res, next) => {
    console.log('API Request:', {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query
    });
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '../client/dist'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);
        switch (ext) {
            case '.js':
            case '.mjs':
                res.set('Content-Type', 'application/javascript; charset=utf-8');
                break;
            case '.css':
                res.set('Content-Type', 'text/css; charset=utf-8');
                break;
            case '.html':
                res.set('Content-Type', 'text/html; charset=utf-8');
                break;
            case '.json':
                res.set('Content-Type', 'application/json; charset=utf-8');
                break;
            case '.svg':
                res.set('Content-Type', 'image/svg+xml');
                break;
        }
    }
}));

// Handle React routing - must be last
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../client/dist/index.html'), {
        headers: {
            'Content-Type': 'text/html; charset=utf-8'
        }
    });
});

const PORT = process.env.PORT || 3001;

// Start server after database is initialized
pool.query('SELECT NOW()', (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log('Static files served from:', path.join(__dirname, '../client/dist'));
    });
});