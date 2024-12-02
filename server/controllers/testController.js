const pool = require('../config/db');

const testController = {
    getPreviousNames: async (req, res) => {
        try {
            const result = await pool.query(
                'SELECT DISTINCT first_name || \' \' || last_name as full_name FROM users ORDER BY full_name'
            );
            res.json(result.rows.map(row => row.full_name));
        } catch (err) {
            console.error('Error fetching names:', err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    submitTest: async (req, res) => {
        const { name, test_period, passed, notes } = req.body;
        
        try {
            // Split the full name into first and last name
            const [first_name, ...lastNameParts] = name.split(' ');
            const last_name = lastNameParts.join(' ');
    
            // Find the user ID
            const userResult = await pool.query(
                'SELECT id FROM users WHERE first_name = $1 AND last_name = $2',
                [first_name, last_name]
            );
    
            if (userResult.rows.length === 0) {
                return res.status(400).json({ error: 'User not found' });
            }
    
            const user_id = userResult.rows[0].id;
    
            // Insert the test
            const result = await pool.query(
                'INSERT INTO esd_tests (user_id, test_date, test_time, test_period, passed, notes) VALUES ($1, CURRENT_DATE, CURRENT_TIME, $2, $3, $4) RETURNING *',
                [user_id, test_period, passed, notes]
            );
    
            console.log('Test submitted:', result.rows[0]); // Debug log
            res.json({ message: 'Test submitted successfully' });
        } catch (err) {
            console.error('Error submitting test:', err);
            res.status(500).json({ error: 'Server error' });
        }
    },

    getTestHistory: async (req, res) => {
        try {
            const result = await pool.query(
                `SELECT 
                    e.id,
                    u.first_name || ' ' || u.last_name as name,
                    e.test_date,
                    e.test_time,
                    e.test_period,
                    e.passed,
                    e.notes,
                    e.created_at
                FROM esd_tests e
                JOIN users u ON e.user_id = u.id
                ORDER BY e.created_at DESC`
            );
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching test history:', err);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

module.exports = testController;