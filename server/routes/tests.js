const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const auth = require('../middleware/auth');

// Get test history
router.get('/history', async (req, res) => {
    try {
        const tests = await testController.getTestHistory();
        res.json(tests);
    } catch (error) {
        console.error('Error in /tests/history:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;