const pool = require("../db");

const getAllItems = async (req, res) => {
    try {
        const { category, excludeUser } = req.query;
        let query = "SELECT * FROM items";
        let params = [];
        let conditions = [];

        if (category && category !== 'All') {
            conditions.push(`category = $${params.length + 1}`);
            params.push(category);
        }

        // Exclude logged-in user's own items from discovery
        if (excludeUser) {
            conditions.push(`owner_id != $${params.length + 1}`);
            params.push(parseInt(excludeUser));
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        query += " ORDER BY created_at DESC";
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { getAllItems };