const pool = require('../config/db');

const testController = {
    getTestHistory: async () => {
        try {
            const result = await pool.query(`
                SELECT 
                    t.id,
                    t.test_date,
                    t.test_time,
                    t.passed,
                    t.notes,
                    u.first_name,
                    u.last_name
                FROM esd_tests t
                LEFT JOIN users u ON t.user_id = u.id
                ORDER BY t.test_date DESC, t.test_time DESC
            `);
            return result.rows;
        } catch (error) {
            console.error('Database error in getTestHistory:', error);
            throw new Error('Failed to fetch test history');
        }
    }
};

module.exports = testController;