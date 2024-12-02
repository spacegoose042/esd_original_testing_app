const cron = require('node-cron');
const pool = require('../db');
const { sendMissingTestAlert } = require('./emailService');

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

    console.log('Starting morning test check...');
    try {
        const result = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.manager_email
            FROM users u
            WHERE u.is_admin = false
            AND u.manager_email IS NOT NULL
            AND NOT EXISTS (
                SELECT 1
                FROM esd_tests t
                WHERE t.user_id = u.id
                AND t.created_at::date = CURRENT_DATE
                AND t.created_at::time BETWEEN '06:00:00' AND '10:00:00'
                AND t.test_period = 'AM'
            )
        `);

        console.log(`Found ${result.rows.length} users missing morning tests`);

        for (const user of result.rows) {
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

    console.log('Starting afternoon test check...');
    try {
        const result = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.manager_email
            FROM users u
            WHERE u.is_admin = false
            AND u.manager_email IS NOT NULL
            AND NOT EXISTS (
                SELECT 1
                FROM esd_tests t
                WHERE t.user_id = u.id
                AND t.created_at::date = CURRENT_DATE
                AND t.created_at::time BETWEEN '12:00:00' AND '15:00:00'
                AND t.test_period = 'PM'
            )
        `);

        console.log(`Found ${result.rows.length} users missing afternoon tests`);

        for (const user of result.rows) {
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

// Schedule the checks
// Morning check at 10:01 AM on weekdays
cron.schedule('1 10 * * 1-5', checkMorningTests);

// Afternoon check at 3:01 PM on weekdays
cron.schedule('1 15 * * 1-5', checkAfternoonTests);

// Export for testing purposes
module.exports = {
    checkMorningTests,
    checkAfternoonTests
};