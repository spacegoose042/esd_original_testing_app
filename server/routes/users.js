const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');

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
                COALESCE(m.first_name || ' ' || m.last_name, 'None') as manager_name,
                u.manager_id
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

// Get all departments (must come before /:id route)
router.get('/departments', auth, async (req, res) => {
    try {
        console.log('Fetching departments');
        const query = `
            SELECT 
                id,
                name,
                created_at::text as created_at
            FROM departments
            ORDER BY name
        `;
        
        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} departments:`, result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching departments:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query
        });
        res.status(500).json({ 
            error: 'Failed to fetch departments',
            details: err.message
        });
    }
});

// Get all managers (must come before /:id route)
router.get('/managers', auth, async (req, res) => {
    try {
        console.log('Fetching managers');
        const query = `
            SELECT 
                u.id,
                u.first_name,
                u.last_name,
                d.name as department_name
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.is_manager = true OR u.is_admin = true
            ORDER BY u.first_name, u.last_name
        `;
        
        const result = await pool.query(query);
        console.log(`Found ${result.rows.length} managers:`, result.rows);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching managers:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query
        });
        res.status(500).json({ 
            error: 'Failed to fetch managers',
            details: err.message
        });
    }
});

// Get single user
router.get('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Fetching user:', id);
        
        const query = `
            SELECT 
                u.id, 
                u.first_name, 
                u.last_name, 
                u.email,
                u.is_admin,
                u.is_manager,
                u.manager_id,
                u.department_id,
                u.created_at::text as created_at,
                COALESCE(m.first_name || ' ' || m.last_name, 'None') as manager_name
            FROM users u
            LEFT JOIN users m ON u.manager_id = m.id
            WHERE u.id = $1
        `;
        
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            console.log('User not found:', id);
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Found user:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query,
            userId: req.params.id
        });
        res.status(500).json({ 
            error: 'Server error',
            details: err.message
        });
    }
});

// Update user
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, manager_id, is_admin } = req.body;
        console.log('Updating user:', { id, first_name, last_name, manager_id, is_admin });

        // First check if the user exists
        const checkUser = await pool.query('SELECT id FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If manager_id is provided, check if the manager exists
        if (manager_id) {
            const checkManager = await pool.query('SELECT id FROM users WHERE id = $1', [manager_id]);
            if (checkManager.rows.length === 0) {
                return res.status(400).json({ error: 'Selected manager does not exist' });
            }
        }

        const query = `
            UPDATE users 
            SET 
                first_name = $1,
                last_name = $2,
                manager_id = $3,
                is_admin = $4
            WHERE id = $5
            RETURNING 
                id, 
                first_name, 
                last_name, 
                email,
                is_admin,
                manager_id,
                created_at::text as created_at
        `;

        const result = await pool.query(query, [
            first_name,
            last_name,
            manager_id || null,  // Convert empty string to null
            is_admin,
            id
        ]);

        console.log('User updated successfully:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query,
            userId: req.params.id,
            body: req.body
        });
        res.status(500).json({ 
            error: 'Failed to update user',
            details: err.message
        });
    }
});

// Create new user
router.post('/', auth, async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            email,
            manager_id,
            department_id,
            is_manager,
            is_admin
        } = req.body;

        console.log('Creating new user:', {
            first_name,
            last_name,
            email,
            manager_id,
            department_id,
            is_manager,
            is_admin
        });

        // Validate department exists
        if (department_id) {
            const deptCheck = await pool.query('SELECT id FROM departments WHERE id = $1', [department_id]);
            if (deptCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Selected department does not exist' });
            }
        }

        // Validate manager exists
        if (manager_id) {
            const managerCheck = await pool.query('SELECT id FROM users WHERE id = $1', [manager_id]);
            if (managerCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Selected manager does not exist' });
            }
        }

        // Generate a random password for managers and admins
        let password_hash = null;
        if (is_manager || is_admin) {
            if (!email) {
                return res.status(400).json({ 
                    error: 'Email is required for managers and admins'
                });
            }
            // Generate a random password
            const tempPassword = Math.random().toString(36).slice(-8);
            password_hash = await bcrypt.hash(tempPassword, 10);
            console.log('Generated temporary password for new manager/admin:', tempPassword);
        }

        const query = `
            INSERT INTO users (
                first_name,
                last_name,
                email,
                password_hash,
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
                manager_id,
                department_id,
                is_manager,
                is_admin,
                created_at::text as created_at
        `;

        const result = await pool.query(query, [
            first_name,
            last_name,
            email || null,
            password_hash,
            manager_id || null,
            department_id || null,
            is_manager || false,
            is_admin || false
        ]);

        const response = {
            ...result.rows[0],
            ...(password_hash && { 
                message: 'User created with temporary password. Please change it upon first login.'
            })
        };

        console.log('User created successfully:', response);
        res.status(201).json(response);
    } catch (err) {
        console.error('Error creating user:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query,
            body: req.body
        });

        // Check for unique constraint violation
        if (err.code === '23505' && err.constraint === 'users_email_unique') {
            return res.status(400).json({
                error: 'Email already exists',
                details: 'A user with this email address already exists'
            });
        }

        res.status(500).json({
            error: 'Failed to create user',
            details: err.message
        });
    }
});

module.exports = router;