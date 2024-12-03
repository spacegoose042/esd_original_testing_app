const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all users
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all users...');
        const result = await pool.query(`
            SELECT id, first_name, last_name, email, is_admin 
            FROM users 
            ORDER BY first_name, last_name
        `);
        console.log('Found users:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get a specific user
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, first_name, last_name, email, is_admin FROM users WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

module.exports = router;