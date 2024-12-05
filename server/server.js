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

// Configure static file serving
app.use(express.static(staticPath, {
    maxAge: '1y',
    etag: true,
    index: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
            res.set('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
            res.set('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// Debug route to check static files
app.get('/debug/static-files', (req, res) => {
    try {
        const files = fs.readdirSync(staticPath);
        const assetsPath = path.join(staticPath, 'assets');
        const assetFiles = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
        
        // Read the manifest file if it exists
        const manifestPath = path.join(staticPath, 'manifest.json');
        const manifest = fs.existsSync(manifestPath) 
            ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
            : null;
            
        res.json({ 
            files, 
            assetFiles, 
            staticPath,
            manifest 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Handle client-side routing
app.get('*', (req, res) => {
    // Don't handle API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve the main HTML file for all other routes
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