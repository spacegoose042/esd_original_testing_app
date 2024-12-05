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

// Create new user
router.post('/', async (req, res) => {
    try {
        const { first_name, last_name, manager_id, department_id, is_manager } = req.body;

        console.log('Received registration request:', {
            first_name,
            last_name,
            manager_id,
            department_id,
            is_manager
        });

        // Validate required fields
        if (!first_name || !last_name || !department_id) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'First name, last name, and department are required'
            });
        }

        // Insert the new user with better error handling
        const result = await pool.query(`
            INSERT INTO users (
                first_name,
                last_name,
                manager_id,
                department_id,
                is_manager,
                email,
                password
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING 
                id, 
                first_name, 
                last_name, 
                is_manager, 
                department_id, 
                manager_id
        `, [
            first_name,
            last_name,
            manager_id || null,
            department_id,
            is_manager || false,
            null, // email is optional for non-admin users
            null  // password is optional for non-admin users
        ]);

        // Log successful creation
        console.log('User created successfully:', result.rows[0]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating user:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            detail: error.detail
        });

        // Send appropriate error response
        res.status(500).json({ 
            error: 'Failed to create user',
            details: error.message,
            code: error.code
        });
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

        console.log('Updating user:', { id, ...req.body });

        const result = await pool.query(`
            UPDATE users
            SET 
                first_name = $1,
                last_name = $2,
                email = $3,
                is_admin = $4,
                is_manager = $5,
                department_id = $6,
                manager_id = $7
            WHERE id = $8
            RETURNING 
                id, 
                first_name, 
                last_name, 
                email, 
                is_admin, 
                is_manager, 
                department_id, 
                manager_id
        `, [first_name, last_name, email, is_admin, is_manager, department_id, manager_id, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Fetch the updated user with all related information
        const updatedUser = await pool.query(`
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
            WHERE u.id = $1
        `, [id]);

        res.json(updatedUser.rows[0]);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ 
            error: 'Failed to update user',
            details: error.message,
            code: error.code
        });
    }
});

module.exports = router;