const cron = require('node-cron');
const pool = require('../config/db');
const { sendMissingTestAlert } = require('./emailService');

// Set timezone to CST
process.env.TZ = 'America/Chicago';

// Utility function to check if it's a holiday or weekend
const isWorkDay = () => {
    const today = new Date();
    const day = today.getDay();
    return day !== 0 && day !== 6; // 0 is Sunday, 6 is Saturday
};

// Check for missing morning tests
const checkMorningTests = async () => {
    if (!isWorkDay()) {
        console.log('Skipping morning check - not a work day');
        return;
    }

    console.log('Starting morning test check...', new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    try {
        // First, get all active users who need to test (not exempt)
        const usersToCheck = await pool.query(`
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.manager_email,
                m.exempt_from_testing as manager_is_exempt
            FROM users u
            LEFT JOIN users m ON u.manager_id = m.id
            WHERE u.is_admin = false
            AND u.is_active = true
            AND u.exempt_from_testing = false
            AND u.manager_email IS NOT NULL
            -- Check if user is not marked as absent
            AND NOT EXISTS (
                SELECT 1
                FROM absences a
                WHERE a.user_id = u.id
                AND a.absence_date = CURRENT_DATE
                AND (a.period = 'AM' OR a.period = 'FULL')
            )
            AND NOT EXISTS (
                SELECT 1
                FROM esd_tests t
                WHERE t.user_id = u.id
                AND t.test_date = CURRENT_DATE
                AND t.test_time BETWEEN '06:00:00' AND '10:00:00'
                AND t.test_period = 'AM'
            )
        `);

        console.log(`Found ${usersToCheck.rows.length} users missing morning tests`);

        for (const user of usersToCheck.rows) {
            await sendMissingTestAlert(
                `${user.first_name} ${user.last_name}`,
                'morning',
                user.manager_email
            );
        }
    } catch (error) {
        console.error('Morning check failed:', error);
    }
};

// Check for missing afternoon tests
const checkAfternoonTests = async () => {
    if (!isWorkDay()) {
        console.log('Skipping afternoon check - not a work day');
        return;
    }

    console.log('Starting afternoon test check...', new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
    try {
        const usersToCheck = await pool.query(`
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.manager_email,
                m.exempt_from_testing as manager_is_exempt
            FROM users u
            LEFT JOIN users m ON u.manager_id = m.id
            WHERE u.is_admin = false
            AND u.is_active = true
            AND u.exempt_from_testing = false
            AND u.manager_email IS NOT NULL
            -- Check if user is not marked as absent
            AND NOT EXISTS (
                SELECT 1
                FROM absences a
                WHERE a.user_id = u.id
                AND a.absence_date = CURRENT_DATE
                AND (a.period = 'PM' OR a.period = 'FULL')
            )
            AND NOT EXISTS (
                SELECT 1
                FROM esd_tests t
                WHERE t.user_id = u.id
                AND t.test_date = CURRENT_DATE
                AND t.test_time BETWEEN '12:00:00' AND '15:00:00'
                AND t.test_period = 'PM'
            )
        `);

        console.log(`Found ${usersToCheck.rows.length} users missing afternoon tests`);

        for (const user of usersToCheck.rows) {
            await sendMissingTestAlert(
                `${user.first_name} ${user.last_name}`,
                'afternoon',
                user.manager_email
            );
        }
    } catch (error) {
        console.error('Afternoon check failed:', error);
    }
};

module.exports = {
    checkMorningTests,
    checkAfternoonTests
};