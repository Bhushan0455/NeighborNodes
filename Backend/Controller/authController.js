const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { getPincodeCoords } = require("../utils/pincodeMap");

const register = async (req, res) => {
    try {
        const { name, email, phone, password, role, locality, pincode, address } = req.body;

        // 1. Validate pincode and get coordinates
        if (!pincode) {
            return res.status(400).json({ success: false, error: "Pincode is required" });
        }

        const coords = getPincodeCoords(pincode);
        if (!coords) {
            return res.status(400).json({ 
                success: false, 
                error: "Unsupported pincode. Please enter a valid pincode from supported areas." 
            });
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Use pincode center coordinates with a small random offset
        //    so users in the same pincode appear at slightly different spots (~200m spread)
        const offsetRange = 0.002; // ~200 meters
        const latOffset = (Math.random() - 0.5) * offsetRange;
        const lngOffset = (Math.random() - 0.5) * offsetRange;
        const latitude = parseFloat((coords.lat + latOffset).toFixed(6));
        const longitude = parseFloat((coords.lng + lngOffset).toFixed(6));
        const userLocality = locality || coords.area;

        // 4. Insert user with all location fields
        const newUser = await pool.query(
            `INSERT INTO users (name, email, phone, password, role, locality, pincode, full_address, latitude, longitude) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             RETURNING id, name, email`,
            [name, email, phone, hashedPassword, role || 'borrower', userLocality, pincode, address || '', latitude, longitude]
        );

        const user = newUser.rows[0];
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '24h' });

        res.json({ success: true, token, userId: user.id, name: user.name, user: user });
    } catch (err) {
        console.error("Registration Error:", err.message);
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

        if (user.rows.length === 0) return res.status(404).json({ error: "User not found" });

        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) return res.status(401).json({ error: "Invalid password" });

        // Generate a token that expires in 24 hours
        const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET || 'secret123', { expiresIn: '24h' });
        
        res.json({ success: true, token, userId: user.rows[0].id, name: user.rows[0].name });
    } catch (err) {
        res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
    }
};

module.exports = { register, login };