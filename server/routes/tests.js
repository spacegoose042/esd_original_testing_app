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

module.exports = router;