const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { Parser } = require('json2csv');

// Submit test result - remove the auth middleware
router.post('/submit', async (req, res) => {
    try {
        const { user_id, test_period, passed } = req.body;

        // Insert test result
        const result = await pool.query(
            'INSERT INTO esd_tests (user_id, test_period, passed, test_date, test_time) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME) RETURNING *',
            [user_id, test_period, passed]
        );

        res.json({
            success: true,
            message: 'Test submitted successfully',
            test: result.rows[0]
        });
    } catch (err) {
        console.error('Test submission error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to submit test'
        });
    }
});

// Get user's tests for today
router.get('/today', auth, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const result = await pool.query(`
            SELECT * FROM esd_tests 
            WHERE user_id = $1 
            AND created_at::date = CURRENT_DATE
            ORDER BY created_at DESC`,
            [user_id]
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get test history
router.get('/history', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const query = `
            SELECT 
                t.id,
                t.test_date,
                t.test_time,
                t.test_period,
                t.passed,
                u.first_name,
                u.last_name
            FROM esd_tests t
            JOIN users u ON t.user_id = u.id
            WHERE t.test_date BETWEEN $1 AND $2
            ORDER BY t.test_date DESC, t.test_time DESC
        `;

        const result = await pool.query(query, [start_date, end_date]);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching test history:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Export tests to CSV
router.get('/export', auth, async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        const query = `
            SELECT 
                t.test_date,
                t.test_time,
                t.test_period,
                CASE WHEN t.passed THEN 'PASS' ELSE 'FAIL' END as result,
                u.first_name,
                u.last_name,
                u.manager_email
            FROM esd_tests t
            JOIN users u ON t.user_id = u.id
            WHERE t.test_date BETWEEN $1 AND $2
            ORDER BY t.test_date DESC, t.test_time DESC
        `;

        const result = await pool.query(query, [start_date, end_date]);

        // Convert to CSV
        const fields = ['test_date', 'test_time', 'test_period', 'result', 'first_name', 'last_name', 'manager_email'];
        const opts = { fields };
        
        const parser = new Parser(opts);
        const csv = parser.parse(result.rows);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=esd_tests_${start_date}_to_${end_date}.csv`);
        res.send(csv);

    } catch (err) {
        console.error('Export error:', err);
        res.status(500).json({ error: 'Failed to export data' });
    }
});

module.exports = router;