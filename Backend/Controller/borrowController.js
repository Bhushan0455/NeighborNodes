const pool = require("../db"); // Import your database connection

// 1. Create a new borrow request
const createBorrow = async (req, res) => {
    try {
        // Destructure data coming from your Borrow.html form
        const { item_id, borrower_id, start_date, end_date } = req.body;

        // SQL Query to insert the borrow request into your PostgreSQL table
        const request = await pool.query(
            "INSERT INTO borrow_requests (item_id, borrower_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *",
            [item_id, borrower_id, start_date, end_date]
        );

        // Send back the newly created request as a JSON response
        res.status(201).json({
            success: true,
            data: request.rows[0]
        });
    } catch (err) {
        console.error("BORROW ERROR:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error" 
        });
    }
};

// 2. Get pickup address — ONLY if borrow request is ACCEPTED
// This protects exact address privacy until request approval
const getPickupAddress = async (req, res) => {
    try {
        const { requestId, userId } = req.params;

        // Verify: the request must be accepted AND the requester must be the borrower
        const result = await pool.query(`
            SELECT 
                br.request_status,
                br.borrower_id,
                u.full_address,
                u.locality,
                u.pincode,
                u.name AS owner_name,
                u.phone AS owner_phone,
                i.item_name
            FROM borrow_requests br
            JOIN items i ON br.item_id = i.id
            JOIN users u ON i.owner_id = u.id
            WHERE br.id = $1
        `, [requestId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: "Borrow request not found" 
            });
        }

        const request = result.rows[0];

        // Privacy check: Only the approved borrower can see the address
        if (parseInt(userId) !== request.borrower_id) {
            return res.status(403).json({ 
                success: false, 
                error: "You are not authorized to view this address" 
            });
        }

        // Privacy check: Request must be accepted or collected (borrower needs address to return)
        if (!['accepted', 'collected'].includes(request.request_status)) {
            return res.json({
                success: true,
                address_visible: false,
                message: "Address will be revealed after your request is accepted",
                status: request.request_status
            });
        }

        // Request is accepted — reveal full address
        res.json({
            success: true,
            address_visible: true,
            data: {
                item_name: request.item_name,
                owner_name: request.owner_name,
                owner_phone: request.owner_phone,
                full_address: request.full_address,
                locality: request.locality,
                pincode: request.pincode
            }
        });

    } catch (err) {
        console.error("Address Reveal Error:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch pickup address" 
        });
    }
};

// 3. Mark item as collected (Borrower: accepted → collected)
const markCollected = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { borrower_id } = req.body;

        // Verify the request exists and belongs to this borrower
        const result = await pool.query(
            "SELECT request_status, borrower_id FROM borrow_requests WHERE id = $1",
            [requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        const request = result.rows[0];

        // Only the borrower can mark as collected
        if (parseInt(borrower_id) !== request.borrower_id) {
            return res.status(403).json({ success: false, error: "Only the borrower can mark this as collected" });
        }

        // Can only collect if currently accepted
        if (request.request_status !== 'accepted') {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot mark as collected. Current status is '${request.request_status}'` 
            });
        }

        await pool.query(
            "UPDATE borrow_requests SET request_status = 'collected' WHERE id = $1",
            [requestId]
        );

        res.json({ success: true, message: "Item marked as collected" });
    } catch (err) {
        console.error("Mark Collected Error:", err.message);
        res.status(500).json({ success: false, error: "Failed to update status" });
    }
};

// 4. Mark item as returned (Borrower: collected → returned)
const markReturned = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { borrower_id } = req.body;

        // Verify the request exists and belongs to this borrower
        const result = await pool.query(
            "SELECT request_status, borrower_id FROM borrow_requests WHERE id = $1",
            [requestId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        const request = result.rows[0];

        // Only the borrower can mark as returned
        if (parseInt(borrower_id) !== request.borrower_id) {
            return res.status(403).json({ success: false, error: "Only the borrower can mark this as returned" });
        }

        // Can only return if currently collected
        if (request.request_status !== 'collected') {
            return res.status(400).json({ 
                success: false, 
                error: `Cannot mark as returned. Current status is '${request.request_status}'` 
            });
        }

        await pool.query(
            "UPDATE borrow_requests SET request_status = 'returned' WHERE id = $1",
            [requestId]
        );

        res.json({ success: true, message: "Item marked as returned" });
    } catch (err) {
        console.error("Mark Returned Error:", err.message);
        res.status(500).json({ success: false, error: "Failed to update status" });
    }
};

module.exports = { createBorrow, getPickupAddress, markCollected, markReturned };