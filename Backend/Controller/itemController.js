const pool = require("../db");

const getAllItems = async (req, res) => {
    try {
        const { category, excludeUser } = req.query;
        let query = "SELECT * FROM items";
        let params = [];
        let conditions = ["is_active = true"];

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
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

const getItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await pool.query(
            `SELECT i.*, u.name as owner_name, u.locality 
             FROM items i 
             JOIN users u ON i.owner_id = u.id 
             WHERE i.id = $1 AND i.is_active = true`, 
            [id]
        );
        
        if (item.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Item not found" });
        }
        
        res.json({ success: true, data: item.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

module.exports = { getAllItems, getItemById };