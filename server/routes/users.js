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
    const client = await pool.connect();
    try {
        const { id } = req.params;
        console.log('Update request received:', {
            id,
            body: req.body,
            headers: req.headers
        });

        const { 
            first_name, 
            last_name, 
            manager_id, 
            is_admin,
            is_active 
        } = req.body;

        await client.query('BEGIN');

        // First check if the user exists
        const checkUser = await client.query('SELECT id, email FROM users WHERE id = $1', [id]);
        if (checkUser.rows.length === 0) {
            console.log('User not found:', id);
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('Found user:', checkUser.rows[0]);

        // If manager_id is provided, check if the manager exists
        if (manager_id) {
            const checkManager = await client.query('SELECT id FROM users WHERE id = $1', [manager_id]);
            if (checkManager.rows.length === 0) {
                console.log('Manager not found:', manager_id);
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Selected manager does not exist' });
            }
            console.log('Found manager:', checkManager.rows[0]);
        }

        // Build update fields and values array
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        console.log('Building update query with fields:', {
            first_name,
            last_name,
            manager_id,
            is_admin,
            is_active
        });

        if (first_name !== undefined) {
            updateFields.push(`first_name = $${paramCount}`);
            values.push(first_name);
            paramCount++;
        }
        if (last_name !== undefined) {
            updateFields.push(`last_name = $${paramCount}`);
            values.push(last_name);
            paramCount++;
        }
        if (manager_id !== undefined) {
            updateFields.push(`manager_id = $${paramCount}`);
            values.push(manager_id === '' ? null : manager_id);
            paramCount++;
        }
        if (is_admin !== undefined) {
            updateFields.push(`is_admin = $${paramCount}`);
            values.push(Boolean(is_admin));
            paramCount++;
        }
        if (is_active !== undefined) {
            updateFields.push(`is_active = $${paramCount}`);
            values.push(Boolean(is_active));
            paramCount++;
        }

        // Add the user ID as the last parameter
        values.push(id);

        if (updateFields.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No fields to update' });
        }

        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramCount}
            RETURNING 
                id, 
                first_name, 
                last_name, 
                email,
                is_admin,
                is_active,
                manager_id,
                created_at::text as created_at
        `;

        console.log('Executing update query:', {
            query,
            values,
            paramCount
        });

        const result = await client.query(query, values);
        
        if (result.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'User not found after update' });
        }

        await client.query('COMMIT');

        console.log('User updated successfully:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Detailed error updating user:', {
            error: err,
            message: err.message,
            stack: err.stack,
            query: err.query,
            parameters: err.parameters,
            code: err.code,
            position: err.position,
            detail: err.detail,
            hint: err.hint,
            where: err.where,
            severity: err.severity,
            schema: err.schema,
            table: err.table,
            column: err.column,
            dataType: err.dataType,
            constraint: err.constraint
        });
        res.status(500).json({ 
            error: 'Failed to update user',
            details: err.message,
            code: err.code,
            detail: err.detail,
            constraint: err.constraint
        });
    } finally {
        client.release();
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

        // Generate a password for all users (since it's required in the database)
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        console.log('Generated password for new user:', tempPassword);

        // Validate email for managers and admins
        if ((is_manager || is_admin) && !email) {
            return res.status(400).json({ 
                error: 'Email is required for managers and admins'
            });
        }

        const query = `
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
            hashedPassword,
            manager_id || null,
            department_id || null,
            is_manager || false,
            is_admin || false
        ]);

        const response = {
            ...result.rows[0],
            tempPassword,
            message: is_manager || is_admin ? 
                'User created with temporary password. Please provide this password to the user.' :
                'User created successfully. Password not required for regular users.'
        };

        console.log('User created successfully:', {
            ...response,
            tempPassword: '(password logged above)'
        });
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