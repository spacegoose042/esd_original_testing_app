require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');

// Validate required email environment variables
function validateEmailConfig() {
    const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        console.warn('\x1b[33m%s\x1b[0m', `
⚠️  Warning: Missing email configuration variables:
${missing.map(v => `   - ${v}`).join('\n')}

Email notifications will be disabled. To enable email notifications,
please set these variables in your Railway project dashboard.
        `);
        return false;
    }

    // Validate EMAIL_PORT is a number
    if (isNaN(parseInt(process.env.EMAIL_PORT))) {
        console.warn('\x1b[33m%s\x1b[0m', `
⚠️  Warning: EMAIL_PORT must be a number. Current value: ${process.env.EMAIL_PORT}
Email notifications will be disabled.
        `);
        return false;
    }

    console.log('\x1b[32m%s\x1b[0m', '✅ Email configuration validated successfully');
    return true;
}

// Initialize email services if configuration is valid
const emailConfigValid = validateEmailConfig();
if (emailConfigValid) {
    // Only initialize email-related services if config is valid
    const { scheduleWeeklyReport } = require('./cronJobs');
    const scheduler = require('./services/scheduler');
    
    // Start the scheduled tasks
    scheduleWeeklyReport();
    console.log('📅 Scheduled tasks initialized');
} else {
    console.log('📧 Email services disabled due to missing configuration');
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        timestamp: new Date().toISOString(),
        emailServices: emailConfigValid ? 'enabled' : 'disabled'
    });
});

const staticPath = path.join(__dirname, '../client/dist');

// Serve module scripts with correct MIME type
app.get('*/index.*.js', (req, res, next) => {
    const filePath = path.join(staticPath, req.path.replace(/^\//, ''));
    res.set('Content-Type', 'text/javascript');
    res.sendFile(filePath);
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
🚀 Server running on port ${PORT}
🌍 Mode: ${process.env.NODE_ENV || 'development'}
📧 Email services: ${emailConfigValid ? 'enabled' : 'disabled'}
    `);
});