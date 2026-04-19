const pool = require("../db"); // Import your database connection

// ============================================================================
// 1. Create a new borrow request (with row-level locking)
//
// RACE CONDITION PREVENTION:
// --------------------------
// Without locking, two borrowers could simultaneously submit requests
// for the same item even after it's been marked 'unavailable'.
// We lock the item row with FOR UPDATE, verify it's still 'available',
// then insert the request — all inside a single transaction.
// ============================================================================
const createBorrow = async (req, res) => {
    const client = await pool.connect();

    try {
        const { item_id, borrower_id, start_date, end_date } = req.body;

        // ── TRANSACTION START ──
        await client.query("BEGIN");

        // Lock the item row to prevent concurrent modifications.
        // Any other transaction trying to borrow the same item will BLOCK here
        // until this transaction completes.
        const itemCheck = await client.query(
            "SELECT id, status, owner_id FROM items WHERE id = $1 FOR UPDATE",
            [item_id]
        );

        if (itemCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, error: "Item not found" });
        }

        const item = itemCheck.rows[0]; 

        // Prevent borrowing your own item
        if (item.owner_id === parseInt(borrower_id)) {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                error: "You cannot borrow your own item."
            });
        }

        // Check item is still available for borrowing
        if (item.status !== 'available') {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                error: "This item is no longer available for borrowing."
            });
        }

        // Insert the borrow request
        const request = await client.query(
            `INSERT INTO borrow_requests (item_id, borrower_id, start_date, end_date)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [item_id, borrower_id, start_date, end_date]
        );

        // ── TRANSACTION END ──
        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            data: request.rows[0]
        });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("BORROW ERROR:", err.message);
        res.status(500).json({
            success: false,
            error: "Internal Server Error"
        });
    } finally {
        client.release();
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

// ============================================================================
// 4. Mark item as returned (Borrower: collected → returned)
//
// Uses a transaction to atomically:
//   1. Mark the borrow request as 'returned'
//   2. Set the item status back to 'available'
// This ensures the item can be borrowed by others again.
// ============================================================================
const markReturned = async (req, res) => {
    const client = await pool.connect();

    try {
        const { requestId } = req.params;
        const { borrower_id } = req.body;

        // ── TRANSACTION START ──
        await client.query("BEGIN");

        // Fetch the request with item_id for the status reset
        const result = await client.query(
            "SELECT request_status, borrower_id, item_id FROM borrow_requests WHERE id = $1",
            [requestId]
        );

        if (result.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        const request = result.rows[0];

        // Only the borrower can mark as returned
        if (parseInt(borrower_id) !== request.borrower_id) {
            await client.query("ROLLBACK");
            return res.status(403).json({ success: false, error: "Only the borrower can mark this as returned" });
        }

        // Can only return if currently collected
        if (request.request_status !== 'collected') {
            await client.query("ROLLBACK");
            return res.status(400).json({ 
                success: false, 
                error: `Cannot mark as returned. Current status is '${request.request_status}'` 
            });
        }

        // Lock the item row before updating its status
        await client.query(
            "SELECT id FROM items WHERE id = $1 FOR UPDATE",
            [request.item_id]
        );

        // Mark borrow request as returned
        await client.query(
            "UPDATE borrow_requests SET request_status = 'returned' WHERE id = $1",
            [requestId]
        );

        // Set item back to 'available' so it can be borrowed again
        await client.query(
            "UPDATE items SET status = 'available' WHERE id = $1",
            [request.item_id]
        );

        // ── TRANSACTION END ──
        await client.query("COMMIT");

        res.json({ success: true, message: "Item marked as returned and is now available again" });
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Mark Returned Error:", err.message);
        res.status(500).json({ success: false, error: "Failed to update status" });
    } finally {
        client.release();
    }
};

module.exports = { createBorrow, getPickupAddress, markCollected, markReturned };