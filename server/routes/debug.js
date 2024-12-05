const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/table-info', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT column_name, is_nullable, column_default, data_type
            FROM information_schema.columns
            WHERE table_name = 'users';
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 