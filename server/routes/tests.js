const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get test history
router.get('/history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id,
                to_char(CURRENT_DATE AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as today,
                to_char(t.test_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as test_date,
                to_char(t.test_time AT TIME ZONE 'America/Chicago', 'HH:MI AM') as test_time,
                t.test_period,
                t.passed,
                t.notes,
                u.first_name,
                u.last_name
            FROM esd_tests t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.test_date DESC, t.test_time DESC
        `);
        
        // Log the first few results for debugging
        console.log('First few test results:', result.rows.slice(0, 3));
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error in /tests/history:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit test result
router.post('/submit', async (req, res) => {
    try {
        const { user_id, test_period, passed, notes } = req.body;
        console.log('Received test submission:', req.body);

        // Ensure consistent period values
        const normalizedPeriod = test_period.startsWith('AM') ? 'AM' : 'PM';

        // Insert test using Chicago timezone
        const result = await pool.query(`
            WITH current_chicago_time AS (
                SELECT CURRENT_TIMESTAMP AT TIME ZONE 'America/Chicago' as chicago_timestamp
            )
            INSERT INTO esd_tests (
                user_id, 
                test_period, 
                passed, 
                notes,
                test_date,
                test_time
            ) 
            SELECT
                $1, 
                $2, 
                $3, 
                $4,
                chicago_timestamp::date,
                chicago_timestamp
            FROM current_chicago_time
            RETURNING 
                id,
                user_id,
                test_period,
                passed,
                notes,
                to_char(test_date AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD') as test_date,
                to_char(test_time AT TIME ZONE 'America/Chicago', 'HH:MI AM') as test_time
        `, [user_id, normalizedPeriod, passed, notes]);

        console.log('Test submitted:', result.rows[0]);
        res.json({ 
            message: 'Test submitted successfully',
            test: result.rows[0]
        });
    } catch (error) {
        console.error('Error submitting test:', error);
        res.status(500).json({ error: 'Failed to submit test' });
    }
});

module.exports = router;