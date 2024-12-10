const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Health check route
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Verify token route
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get latest user data from database
        const result = await pool.query(
            'SELECT is_admin FROM users WHERE id = $1',
            [decoded.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ 
            isAdmin: result.rows[0].is_admin,
            userId: decoded.id
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login attempt:', { 
            email: req.body.email,
            hasPassword: !!req.body.password,
            passwordLength: req.body.password?.length
        });
        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing credentials:', { 
                hasEmail: !!email, 
                hasPassword: !!password 
            });
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user by email
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            console.log('User not found:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        console.log('Found user:', { 
            id: user.id, 
            email: user.email,
            hasPasswordHash: !!user.password,
            passwordHashLength: user.password?.length,
            isActive: user.is_active,
            isAdmin: user.is_admin,
            isManager: user.is_manager
        });

        // Log the actual values being compared (first few chars only for security)
        console.log('Password comparison:', {
            providedPassword: password.substring(0, 3) + '...',
            storedHashStart: user.password?.substring(0, 10) + '...',
            storedHashValid: user.password?.startsWith('$2a$')
        });

        // Compare password with stored hash
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password validation result:', isValid);

        if (!isValid) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create JWT token
        const token = jwt.sign(
            { 
                id: user.id,
                email: user.email,
                is_admin: user.is_admin,
                is_manager: user.is_manager
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful:', {
            userId: user.id,
            isAdmin: user.is_admin,
            isManager: user.is_manager
        });

        // Return user info and token
        res.json({
            token,
            isAdmin: user.is_admin,
            isManager: user.is_manager,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                is_admin: user.is_admin,
                is_manager: user.is_manager,
                manager_id: user.manager_id,
                department_id: user.department_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Server error', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Update the managers list endpoint
router.get('/managers', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                m.id,
                m.first_name,
                m.last_name,
                m.department_id,
                m.email,
                d.name as department_name
            FROM managers m
            LEFT JOIN departments d ON m.department_id = d.id
            ORDER BY m.first_name, m.last_name
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching managers:', error);
        res.status(500).json({ error: 'Failed to fetch managers' });
    }
});

module.exports = router;