const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Get all users - accessible to both authenticated and unauthenticated users
router.get('/', async (req, res) => {
    try {
        // Get the token from the request header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        let query = 'SELECT * FROM users';
        
        // If no token or invalid token, only return non-admin users
        if (!token) {
            query += ' WHERE is_admin = false';
        }
        
        query += ' ORDER BY id ASC';
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single user - requires authentication
router.get('/:id', auth, async (req, res) => {
    try {
        console.log('Fetching user with ID:', req.params.id);
        console.log('Auth token received:', req.header('Authorization'));

        const result = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        res.json({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            manager_email: user.manager_email,
            is_admin: user.is_admin
        });

    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user - requires authentication
router.put('/:id', auth, async (req, res) => {
    try {
        const { first_name, last_name, manager_email, is_admin } = req.body;
        
        const result = await pool.query(
            'UPDATE users SET first_name = $1, last_name = $2, manager_email = $3, is_admin = $4 WHERE id = $5 RETURNING *',
            [first_name, last_name, manager_email, is_admin, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user - requires authentication
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING *',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;