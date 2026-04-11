const db = require("../db");

// 1. Fetch items specifically owned by the logged-in user
const getMyItems = async (req, res) => {
    const { ownerId } = req.params;
    try {
        const items = await db.query("SELECT * FROM items WHERE owner_id = $1", [ownerId]);
        res.json({ success: true, data: items.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. Add a new item for lending
const listItem = async (req, res) => {
    const { owner_id, item_name, category, price_per_day, image_url, description } = req.body;
    try {
        const newItem = await db.query(
            "INSERT INTO items (owner_id, item_name, category, price_per_day, image_url, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [owner_id, item_name, category, price_per_day, image_url, description]
        );
        res.status(201).json({ success: true, data: newItem.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. Get incoming borrow requests for the lender's dashboard
const getLenderRequests = async (req, res) => {
    const { userId } = req.params;
    try {
        const requests = await db.query(
            `SELECT br.*, i.item_name, i.image_url, u.name as borrower_name,
                CASE 
                    WHEN br.request_status = 'collected' AND br.end_date < CURRENT_DATE 
                    THEN true ELSE false 
                END AS is_overdue
             FROM borrow_requests br
             JOIN items i ON br.item_id = i.id
             JOIN users u ON br.borrower_id = u.id
             WHERE i.owner_id = $1
             ORDER BY br.id DESC`,
            [userId]
        );
        res.json({ success: true, data: requests.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. Accept or Reject a request (Lender only: pending → accepted/rejected)
const updateRequestStatus = async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    // Lender can only accept or reject
    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status. Lender can only accept or reject." });
    }

    try {
        // Only allow transition from 'pending'
        const current = await db.query("SELECT request_status FROM borrow_requests WHERE id = $1", [requestId]);
        if (current.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Request not found" });
        }
        if (current.rows[0].request_status !== 'pending') {
            return res.status(400).json({ success: false, error: `Cannot ${status} a request that is already ${current.rows[0].request_status}` });
        }

        await db.query("UPDATE borrow_requests SET request_status = $1 WHERE id = $2", [status, requestId]);
        res.json({ success: true, message: `Request ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 5. Delete a listing
const deleteItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        await db.query("DELETE FROM items WHERE id = $1", [itemId]);
        res.json({ success: true, message: "Item deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

//6. Fetch a single item by ID with owner details
const getItemById = async (req, res) => {
    const { id } = req.params;
    try {
        const item = await db.query(
            `SELECT i.*, u.name as owner_name, u.locality 
             FROM items i 
             JOIN users u ON i.owner_id = u.id 
             WHERE i.id = $1`, 
            [id]
        );
        
        if (item.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Item not found" });
        }
        
        res.json({ success: true, data: item.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// CRITICAL: Export all functions so the Router can see them
module.exports = { 
    getMyItems, 
    listItem, 
    getLenderRequests, 
    updateRequestStatus, 
    deleteItem,
    getItemById 
};