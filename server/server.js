require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const fs = require('fs');

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

// Serve static files from the React app
const staticPath = path.join(__dirname, '../client/dist');

// Configure static file serving with proper MIME types
app.use(express.static(staticPath, {
    maxAge: '1y',
    etag: true,
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// Debug route to check static files
app.get('/debug/static-files', (req, res) => {
    const files = fs.readdirSync(staticPath);
    const assetsPath = path.join(staticPath, 'assets');
    const assetFiles = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
    res.json({ files, assetFiles, staticPath });
});

// Serve index.html for all non-API routes
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    // Check if the request is for a static file
    const filePath = path.join(staticPath, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        let contentType = 'text/plain';
        
        if (ext === '.js') {
            contentType = 'application/javascript; charset=utf-8';
        } else if (ext === '.css') {
            contentType = 'text/css; charset=utf-8';
        } else if (ext === '.html') {
            contentType = 'text/html; charset=utf-8';
        }
        
        res.setHeader('Content-Type', contentType);
        return res.sendFile(filePath);
    }
    
    // For all other routes, send index.html
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(path.join(staticPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;

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