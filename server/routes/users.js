const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all users with optional active status filter
router.get('/', auth, async (req, res) => {
    try {
        const { showInactive } = req.query;
        const query = `
            SELECT id, first_name, last_name, email, is_admin, is_active, 
                   created_at::text as created_at
            FROM users
            ${!showInactive ? 'WHERE is_active = true' : ''}
            ORDER BY created_at DESC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Toggle user active status
router.patch('/:id/toggle-active', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE users 
             SET is_active = NOT is_active 
             WHERE id = $1 
             RETURNING id, first_name, last_name, email, is_admin, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error toggling user status:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;