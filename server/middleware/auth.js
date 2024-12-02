const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        console.log('Attempting to verify token with secret:', process.env.JWT_SECRET.substring(0, 5) + '...'); // Show first 5 chars
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verified successfully:', decoded);
        
        // Add user from payload
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Token verification error:', {
            error: err.message,
            token: token.substring(0, 10) + '...' // Show first 10 chars of token
        });
        res.status(401).json({ error: 'Token is not valid' });
    }
};