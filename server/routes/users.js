const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

// Get all users
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching users');
        
        const query = `
            SELECT 
                id, 
                first_name, 
                last_name, 
                COALESCE(email, '') as email,
                COALESCE(is_admin, false) as is_admin,
                created_at::text as created_at
            FROM users
            ORDER BY created_at DESC
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

module.exports = router;