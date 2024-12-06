const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { sendMissingTestAlert, sendWeeklyReport } = require('../services/emailService');

router.get('/table-info', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT column_name, is_nullable, column_default, data_type
            FROM information_schema.columns
            WHERE table_name = 'users';
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test email functionality
router.post('/test-email', async (req, res) => {
    try {
        const { emailType = 'morning' } = req.body;
        let result;

        switch (emailType) {
            case 'morning':
                // Test morning alert
                result = await sendMissingTestAlert(
                    'Test User',
                    'morning',
                    process.env.EMAIL_USER // Send to configured email for testing
                );
                break;
            case 'afternoon':
                // Test afternoon alert
                result = await sendMissingTestAlert(
                    'Test User',
                    'afternoon',
                    process.env.EMAIL_USER
                );
                break;
            case 'weekly':
                // Test weekly report
                result = await sendWeeklyReport();
                break;
            default:
                return res.status(400).json({ 
                    error: 'Invalid email type. Use "morning", "afternoon", or "weekly"' 
                });
        }

        if (result) {
            res.json({ 
                message: `Test ${emailType} email sent successfully`,
                sentTo: process.env.EMAIL_USER
            });
        } else {
            res.status(500).json({ 
                error: `Failed to send ${emailType} test email` 
            });
        }
    } catch (error) {
        console.error('Email test error:', error);
        res.status(500).json({ 
            error: 'Failed to send test email',
            details: error.message
        });
    }
});

module.exports = router; 