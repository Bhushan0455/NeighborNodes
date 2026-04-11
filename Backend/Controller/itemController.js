const pool = require("../db");

const getAllItems = async (req, res) => {
    try {
        const { category } = req.query;
        let query = "SELECT * FROM items";
        let params = [];

        if (category && category !== 'All') {
            query += " WHERE category = $1";
            params.push(category);
        }

        query += " ORDER BY created_at DESC";
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { getAllItems };