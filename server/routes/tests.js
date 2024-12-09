const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get test history - no auth required
router.get('/history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id,
                t.test_date::text as test_date,
                to_char(t.test_time::time, 'HH12:MI AM') as test_time,
                t.test_period,
                t.passed,
                t.notes,
                u.first_name,
                u.last_name
            FROM esd_tests t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.test_date DESC, t.test_time DESC
        `);
        
        console.log('First few test results:', result.rows.slice(0, 3));
        res.json(result.rows);
    } catch (error) {
        console.error('Error in /tests/history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get active users for autocomplete
router.get('/active-users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT DISTINCT 
                first_name || ' ' || last_name as full_name,
                first_name,
                last_name
            FROM users 
            WHERE first_name IS NOT NULL 
            AND last_name IS NOT NULL
            ORDER BY full_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching active users:', error);
        res.status(500).json({ error: 'Failed to fetch active users' });
    }
});

// Submit test result
router.post('/submit', async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        const { first_name, last_name, test_period, passed, notes } = req.body;
        console.log('Received test submission:', req.body);

        // First, find or create user
        let userResult = await client.query(
            'SELECT id FROM users WHERE first_name = $1 AND last_name = $2',
            [first_name, last_name]
        );

        let userId;
        if (userResult.rows.length === 0) {
            // Create new user without email/password
            const newUserResult = await client.query(
                `INSERT INTO users (first_name, last_name) 
                 VALUES ($1, $2) 
                 RETURNING id`,
                [first_name, last_name]
            );
            userId = newUserResult.rows[0].id;
        } else {
            userId = userResult.rows[0].id;
        }

        // Ensure consistent period values
        const normalizedPeriod = test_period.startsWith('AM') ? 'AM' : 'PM';

        // Insert test
        const result = await client.query(`
            INSERT INTO esd_tests (
                user_id,
                test_period, 
                passed, 
                notes,
                test_date,
                test_time
            ) 
            VALUES (
                $1,
                $2, 
                $3, 
                $4,
                CURRENT_DATE,
                CURRENT_TIME
            )
            RETURNING 
                id,
                test_period,
                passed,
                notes,
                test_date::text as test_date,
                to_char(test_time::time, 'HH12:MI AM') as test_time
        `, [userId, normalizedPeriod, passed, notes]);

        await client.query('COMMIT');

        console.log('Test submitted:', result.rows[0]);
        res.json({ 
            message: 'Test submitted successfully',
            test: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting test:', error);
        res.status(500).json({ error: 'Failed to submit test' });
    } finally {
        client.release();
    }
});

// Get daily test status for all active users
router.get('/daily-status', async (req, res) => {
    try {
        const result = await pool.query(`
            WITH today_tests AS (
                SELECT 
                    user_id,
                    test_period,
                    passed,
                    to_char(test_time::time, 'HH12:MI AM') as test_time
                FROM esd_tests
                WHERE test_date = CURRENT_DATE
            )
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                json_build_object(
                    'passed', am.passed,
                    'time', am.test_time
                ) as am_test,
                json_build_object(
                    'passed', pm.passed,
                    'time', pm.test_time
                ) as pm_test
            FROM users u
            LEFT JOIN (
                SELECT * FROM today_tests WHERE test_period = 'AM'
            ) am ON u.id = am.user_id
            LEFT JOIN (
                SELECT * FROM today_tests WHERE test_period = 'PM'
            ) pm ON u.id = pm.user_id
            WHERE u.is_active = true 
            AND u.exempt_from_testing = false
            ORDER BY u.first_name, u.last_name;
        `);
        
        // Filter out null JSON objects from the results
        const formattedResults = result.rows.map(row => ({
            ...row,
            am_test: row.am_test.passed !== null ? row.am_test : null,
            pm_test: row.pm_test.passed !== null ? row.pm_test : null
        }));

        res.json(formattedResults);
    } catch (error) {
        console.error('Error in /tests/daily-status:', error);
        res.status(500).json({ error: 'Failed to fetch daily test status' });
    }
});

module.exports = router;