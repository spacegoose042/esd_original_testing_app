const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

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
    const client = await pool.connect();
    try {
        const { first_name, last_name, email, manager_id, department_id, is_manager, is_admin } = req.body;

        console.log('Received registration request:', {
            first_name,
            last_name,
            email,
            manager_id,
            department_id,
            is_manager,
            is_admin
        });

        // Validate required fields
        if (!first_name || !last_name || !department_id) {
            return res.status(400).json({ 
                error: 'Missing required fields',
                details: 'First name, last name, and department are required'
            });
        }

        // Only require email for managers and admins
        if ((is_manager || is_admin) && !email) {
            return res.status(400).json({
                error: 'Email required',
                details: 'Email is required for managers and admins'
            });
        }

        // Start transaction
        await client.query('BEGIN');

        // Check if email exists (if provided)
        if (email) {
            const emailCheck = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (emailCheck.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    error: 'Email already exists',
                    details: 'This email is already registered'
                });
            }
        }

        // Generate a random password only for managers and admins
        let hashedPassword = null;
        if (is_manager || is_admin) {
            const tempPassword = Math.random().toString(36).slice(-8);
            hashedPassword = await bcrypt.hash(tempPassword, 10);
        }

        // Insert the new user
        const result = await client.query(`
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password,
                manager_id,
                department_id,
                is_manager,
                is_admin
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING 
                id, 
                first_name, 
                last_name,
                email,
                is_manager,
                is_admin,
                department_id, 
                manager_id
        `, [
            first_name,
            last_name,
            email || null,
            hashedPassword,
            manager_id || null,
            department_id,
            is_manager || false,
            is_admin || false
        ]);

        // Commit transaction
        await client.query('COMMIT');

        // Log successful creation
        console.log('User created successfully:', result.rows[0]);

        const response = {
            ...result.rows[0]
        };

        // Only include temporary password for managers and admins
        if (hashedPassword) {
            response.tempPassword = tempPassword;
        }

        res.status(201).json(response);
    } catch (error) {
        // Rollback transaction on error
        await client.query('ROLLBACK');

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
    } finally {
        client.release();
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