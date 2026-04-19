const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
    // Expecting header: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: "Access Denied: No Token Provided!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
        req.user = decoded; // Contains { id: userId, iat, exp }
        next();
    } catch (err) {
        return res.status(403).json({ success: false, error: "Invalid or Expired Token!" });
    }
};

module.exports = authenticateToken;
