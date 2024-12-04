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

// Serve static files with proper MIME types
app.use(express.static(path.join(__dirname, '../client/dist'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath);
        switch (ext) {
            case '.js':
                res.set({
                    'Content-Type': 'application/javascript; charset=UTF-8',
                    'Cache-Control': 'no-cache',
                    'X-Content-Type-Options': 'nosniff'
                });
                break;
            case '.css':
                res.set('Content-Type', 'text/css');
                break;
            case '.html':
                res.set('Content-Type', 'text/html');
                break;
        }
    },
    index: false // Don't serve index.html for directory requests
}));

// Handle React routing - must be last
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
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