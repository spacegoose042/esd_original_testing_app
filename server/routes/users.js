const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all users with manager and department info
router.get('/', async (req, res) => {
    try {
        console.log('Fetching all users...');
        const result = await pool.query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.is_admin,
                u.is_manager,
                d.name as department_name,
                d.id as department_id,
                m.first_name as manager_first_name,
                m.last_name as manager_last_name,
                m.id as manager_id
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN users m ON u.manager_id = m.id
            ORDER BY u.first_name, u.last_name
        `);
        console.log('Found users:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get all managers
router.get('/managers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, first_name, last_name, email
            FROM users
            WHERE is_manager = true
            ORDER BY first_name, last_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ error: 'Failed to fetch managers' });
    }
});

// Get all departments
router.get('/departments', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, name
            FROM departments
            ORDER BY name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, email, is_admin, is_manager, department_id, manager_id } = req.body;

        const result = await pool.query(`
            UPDATE users
            SET 
                first_name = $1,
                last_name = $2,
                email = $3,
                is_admin = $4,
                is_manager = $5,
                department_id = $6,
                manager_id = $7,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $8
            RETURNING *
        `, [first_name, last_name, email, is_admin, is_manager, department_id, manager_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

module.exports = router;