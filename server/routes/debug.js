const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { sendMissingTestAlert, sendWeeklyReport } = require('../services/emailService');
const { checkMorningTests, checkAfternoonTests } = require('../services/scheduler');

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
        console.log('Received test email request:', req.body);
        const { emailType = 'morning' } = req.body;
        let result;

        // Verify email configuration
        const requiredVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            return res.status(500).json({
                error: 'Missing email configuration',
                details: `Missing variables: ${missing.join(', ')}`
            });
        }

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

        res.json({ 
            message: `Test ${emailType} email sent successfully`,
            sentTo: process.env.EMAIL_USER
        });
    } catch (error) {
        console.error('Detailed email test error:', {
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        
        res.status(500).json({ 
            error: 'Failed to send test email',
            details: error.message,
            code: error.code,
            command: error.command
        });
    }
});

// Debug endpoint to check who should receive notifications
router.get('/check-notifications', async (req, res) => {
    try {
        console.log('Checking for users who should receive notifications...');
        
        // Get ALL users with their status flags
        const usersToCheck = await pool.query(`
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.is_admin,
                u.is_active,
                u.exempt_from_testing,
                m.id as manager_id,
                m.first_name as manager_first_name,
                m.last_name as manager_last_name,
                m.email as manager_email,
                m.exempt_from_testing as manager_is_exempt,
                EXISTS (
                    SELECT 1
                    FROM esd_tests t
                    WHERE t.user_id = u.id
                    AND t.test_date = CURRENT_DATE
                    AND t.test_time BETWEEN '06:00:00' AND '10:00:00'
                    AND t.test_period = 'AM'
                ) as has_morning_test,
                EXISTS (
                    SELECT 1
                    FROM esd_tests t
                    WHERE t.user_id = u.id
                    AND t.test_date = CURRENT_DATE
                    AND t.test_time BETWEEN '12:00:00' AND '15:00:00'
                    AND t.test_period = 'PM'
                ) as has_afternoon_test,
                EXISTS (
                    SELECT 1
                    FROM absences a
                    WHERE a.user_id = u.id
                    AND a.absence_date = CURRENT_DATE
                ) as is_absent
            FROM users u
            LEFT JOIN users m ON u.manager_id = m.id
            -- No WHERE clause so we can see all users
        `);

        // Group users by their status
        const usersByStatus = {
            totalUsers: usersToCheck.rows.length,
            admins: usersToCheck.rows.filter(u => u.is_admin).length,
            inactive: usersToCheck.rows.filter(u => !u.is_active).length,
            exempt: usersToCheck.rows.filter(u => u.exempt_from_testing).length,
            noManager: usersToCheck.rows.filter(u => !u.manager_id).length,
            noManagerEmail: usersToCheck.rows.filter(u => !u.manager_email).length,
            absent: usersToCheck.rows.filter(u => u.is_absent).length,
            hasMorningTest: usersToCheck.rows.filter(u => u.has_morning_test).length,
            hasAfternoonTest: usersToCheck.rows.filter(u => u.has_afternoon_test).length,
            qualifyingForNotifications: usersToCheck.rows.filter(u => 
                !u.is_admin && 
                u.is_active && 
                !u.exempt_from_testing && 
                u.manager_email && 
                !u.is_absent
            ).length
        };

        // Group users by manager for notification summary
        const managerGroups = {};
        usersToCheck.rows.forEach(user => {
            if (user.manager_email && !user.is_admin && user.is_active && !user.exempt_from_testing && !user.is_absent) {
                if (!managerGroups[user.manager_email]) {
                    managerGroups[user.manager_email] = {
                        managerName: `${user.manager_first_name} ${user.manager_last_name}`,
                        missingMorningTests: [],
                        missingAfternoonTests: []
                    };
                }
                if (!user.has_morning_test) {
                    managerGroups[user.manager_email].missingMorningTests.push(
                        `${user.first_name} ${user.last_name}`
                    );
                }
                if (!user.has_afternoon_test) {
                    managerGroups[user.manager_email].missingAfternoonTests.push(
                        `${user.first_name} ${user.last_name}`
                    );
                }
            }
        });

        res.json({
            currentTime: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }),
            stats: usersByStatus,
            notificationsByManager: managerGroups
        });
    } catch (error) {
        console.error('Failed to check notifications:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 