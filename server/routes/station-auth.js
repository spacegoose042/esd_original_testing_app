const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Station Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Get station from database
        const result = await pool.query(
            'SELECT * FROM station_auth WHERE username = $1 AND is_active = true',
            [username]
        );

        const station = result.rows[0];
        if (!station) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, station.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { 
                stationId: station.id,
                type: 'station'
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            stationId: station.id
        });
    } catch (error) {
        console.error('Station login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Verify station token
router.get('/verify', async (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.type !== 'station') {
            return res.status(401).json({ error: 'Invalid token type' });
        }

        const result = await pool.query(
            'SELECT id, username, is_active FROM station_auth WHERE id = $1',
            [decoded.stationId]
        );

        if (!result.rows[0] || !result.rows[0].is_active) {
            return res.status(401).json({ error: 'Station not found or inactive' });
        }

        res.json({ 
            stationId: result.rows[0].id,
            username: result.rows[0].username
        });
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

// Initialize station credentials
router.post('/init', async (req, res) => {
    try {
        const stations = [
            { username: 'station1', password: 'station1pass' },
            { username: 'station2', password: 'station2pass' },
            { username: 'station3', password: 'station3pass' }
        ];

        for (const station of stations) {
            const hashedPassword = await bcrypt.hash(station.password, 10);
            await pool.query(
                'UPDATE station_auth SET password = $1 WHERE username = $2',
                [hashedPassword, station.username]
            );
        }

        res.json({ message: 'Station credentials initialized' });
    } catch (error) {
        console.error('Failed to initialize station credentials:', error);
        res.status(500).json({ error: 'Failed to initialize station credentials' });
    }
});

module.exports = router; 