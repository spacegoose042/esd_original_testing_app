require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

const app = express();

app.use(cors());
app.use(express.json());

// Set proper MIME types first
app.use((req, res, next) => {
    const ext = path.extname(req.url);
    switch (ext) {
        case '.js':
            res.type('application/javascript');
            break;
        case '.css':
            res.type('text/css');
            break;
        case '.html':
            res.type('text/html');
            break;
    }
    next();
});

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '../client/dist'), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        } else if (filePath.endsWith('.css')) {
            res.set('Content-Type', 'text/css');
        }
    }
}));

// API routes
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

// Handle React routing - must be last
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
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