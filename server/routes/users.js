const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all users with optional active status filter
router.get('/', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Fetching users with params:', req.query);
        const { showInactive } = req.query;
        
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                COALESCE(u.email, '') as email,
                u.is_admin, 
                u.is_active,
                u.created_at::text as created_at,
                d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            ${showInactive === 'true' ? '' : 'WHERE COALESCE(u.is_active, true) = true'}
            ORDER BY u.created_at DESC
        `;
        
        console.log('Executing query:', query);
        const result = await client.query(query);
        console.log(`Found ${result.rows.length} users`);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error in GET /users:', err);
        res.status(500).json({ 
            error: 'Server error',
            details: err.message
        });
    } finally {
        client.release();
    }
});

// Toggle user active status
router.patch('/:id/toggle-active', auth, async (req, res) => {
    const client = await pool.connect();
    try {
        console.log('Toggling user status for ID:', req.params.id);
        
        const { id } = req.params;
        const result = await client.query(
            `UPDATE users 
             SET is_active = NOT COALESCE(is_active, true) 
             WHERE id = $1 
             RETURNING id, first_name, last_name, COALESCE(email, '') as email, is_admin, is_active`,
            [id]
        );

        if (result.rows.length === 0) {
            console.log('No user found with ID:', id);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Successfully toggled user status:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error in PATCH /users/:id/toggle-active:', err);
        res.status(500).json({ 
            error: 'Server error',
            details: err.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;