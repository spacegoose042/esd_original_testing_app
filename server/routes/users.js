const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all users with department info
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching users with department info');
        
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                COALESCE(u.email, '') as email,
                COALESCE(u.is_admin, false) as is_admin,
                u.created_at::text as created_at,
                d.name as department_name,
                CASE 
                    WHEN u.is_manager THEN 'Manager'
                    ELSE 'Employee'
                END as role,
                COALESCE(m.first_name || ' ' || m.last_name, 'None') as manager_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN users m ON u.manager_id = m.id
            ORDER BY u.created_at DESC
        `;
        
        console.log('Executing query:', query);
        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} users:`, result.rows);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Detailed error in GET /users:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query
        });
        res.status(500).json({ 
            error: 'Server error',
            details: err.message,
            query: err.query
        });
    }
});

// Get single user
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email,
                u.is_admin,
                u.is_manager,
                u.manager_id,
                u.department_id,
                u.created_at::text as created_at
            FROM users u
            WHERE u.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all managers
router.get('/managers', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.is_manager = true
            ORDER BY u.first_name, u.last_name
        `);
        
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching managers:', err);
        res.status(500).json({ error: 'Failed to fetch managers' });
    }
});

// Update user
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, manager_id, is_admin } = req.body;

        const result = await pool.query(`
            UPDATE users 
            SET 
                first_name = $1,
                last_name = $2,
                manager_id = $3,
                is_admin = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
        `, [first_name, last_name, manager_id, is_admin, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

module.exports = router;