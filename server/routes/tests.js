const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get test history
router.get('/history', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                t.id,
                t.test_date,
                t.test_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as test_time,
                t.passed,
                t.notes,
                u.first_name,
                u.last_name
            FROM esd_tests t
            LEFT JOIN users u ON t.user_id = u.id
            ORDER BY t.test_date DESC, t.test_time DESC
        `);
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

        const result = await pool.query(`
            INSERT INTO esd_tests (
                user_id, 
                test_period, 
                passed, 
                notes,
                test_date,
                test_time
            ) VALUES (
                $1, 
                $2, 
                $3, 
                $4, 
                CURRENT_DATE AT TIME ZONE 'America/Los_Angeles',
                CURRENT_TIMESTAMP AT TIME ZONE 'America/Los_Angeles'
            )
            RETURNING 
                id,
                user_id,
                test_period,
                passed,
                notes,
                test_date,
                test_time AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles' as test_time
        `, [user_id, test_period, passed, notes]);

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