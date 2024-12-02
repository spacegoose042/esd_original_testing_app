const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt for:', email);

        const user = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.rows[0].password_hash
        );

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.rows[0].is_admin) {
            return res.status(401).json({ error: 'Not authorized as admin' });
        }

        const token = jwt.sign(
            { 
                id: user.rows[0].id,
                isAdmin: user.rows[0].is_admin 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({ token });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register route
router.post('/register', auth, async (req, res) => {
    try {
        const { first_name, last_name, manager_email, is_admin, password } = req.body;
        console.log('Registration attempt:', { first_name, last_name, manager_email, is_admin });

        let password_hash = null;
        if (is_admin) {
            if (!password) {
                return res.status(400).json({ 
                    error: 'Password required for admin users'
                });
            }
            const salt = await bcrypt.genSalt(10);
            password_hash = await bcrypt.hash(password, salt);
        }

        // Generate a unique email for non-admin users
        const email = is_admin ? manager_email : `${first_name.toLowerCase()}.${last_name.toLowerCase()}@company.com`;

        // Insert new user
        const result = await pool.query(
            'INSERT INTO users (first_name, last_name, email, manager_email, is_admin, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [first_name, last_name, email, manager_email, is_admin, password_hash]
        );

        console.log('User registered successfully:', {
            id: result.rows[0].id,
            first_name: result.rows[0].first_name,
            last_name: result.rows[0].last_name,
            email: result.rows[0].email,
            is_admin: result.rows[0].is_admin
        });

        res.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: result.rows[0].id,
                first_name: result.rows[0].first_name,
                last_name: result.rows[0].last_name,
                email: result.rows[0].email,
                manager_email: result.rows[0].manager_email,
                is_admin: result.rows[0].is_admin
            }
        });

    } catch (err) {
        console.error('Registration error:', {
            message: err.message,
            code: err.code,
            detail: err.detail
        });
        res.status(500).json({ 
            error: 'Failed to register user',
            details: err.message,
            code: err.code
        });
    }
});

router.get('/verify', auth, async (req, res) => {
    try {
        // The auth middleware already verified the token
        // and added the user data to req.user
        res.json({
            isAdmin: req.user.isAdmin,
            id: req.user.id
        });
    } catch (err) {
        console.error('Error in verify route:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;