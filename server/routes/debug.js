const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/check-files', (req, res) => {
    const distPath = path.join(__dirname, '../../client/dist');
    try {
        const files = fs.readdirSync(distPath);
        const assetsPath = path.join(distPath, 'assets');
        const assetFiles = fs.existsSync(assetsPath) ? fs.readdirSync(assetsPath) : [];
        
        res.json({
            distFiles: files,
            assetFiles,
            distPath,
            assetsPath
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 