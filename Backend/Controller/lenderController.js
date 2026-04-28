const db = require("../db");

// 1. Fetch items specifically owned by the logged-in user
const getMyItems = async (req, res) => {
    const { ownerId } = req.params;
    try {
        const items = await db.query("SELECT * FROM items WHERE owner_id = $1 AND is_active = true", [ownerId]);
        res.json({ success: true, data: items.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

// 2. Add a new item for lending
const listItem = async (req, res) => {
    const { item_name, category, price_per_day, description } = req.body;
    const owner_id = req.body.owner_id || req.body.user_id;

    // Future-ready image handling: use local path if uploaded
    let image_url = 'https://via.placeholder.com/600';
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    } else if (req.body.image_url) {
        image_url = req.body.image_url;
    }

    try {
        const newItem = await db.query(
            "INSERT INTO items (owner_id, item_name, category, price_per_day, image_url, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [owner_id, item_name, category, price_per_day, image_url, description]
        );
        res.status(201).json({ success: true, data: newItem.rows[0] });
    } catch (err) {
        console.error("List Item Error:", err);
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
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
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

// ============================================================================
// 4. Accept or Reject a borrow request (Lender only)
//
// RACE CONDITION PREVENTION:
// --------------------------
// Without locking, two concurrent "accept" calls for different requests
// on the SAME item could both succeed, double-booking the item.
//
// Solution: PostgreSQL row-level locking via SELECT ... FOR UPDATE.
// The first transaction to reach the FOR UPDATE query acquires an
// exclusive row lock on the item. Any concurrent transaction trying
// to lock the same row will BLOCK until the first one COMMITs or
// ROLLBACKs — guaranteeing only one accept can ever succeed.
//
// Transaction flow (accept):
//   BEGIN
//     → SELECT item row FOR UPDATE          (lock the item row)
//     → check item.status === 'available'   (bail if already taken)
//     → UPDATE item SET status='unavailable'
//     → UPDATE this request SET status='accepted'
//     → UPDATE all OTHER pending requests for same item → 'rejected'
//   COMMIT
//
// Transaction flow (reject):
//   Simple status update, no locking needed.
// ============================================================================

const updateRequestStatus = async (req, res) => {
    const { requestId } = req.params;
    const { status } = req.body;

    // Validate: lender can only accept or reject
    if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
            success: false,
            error: "Invalid status. Lender can only accept or reject."
        });
    }

    // ── REJECTION: no lock needed, simple status flip ──
    if (status === 'rejected') {
        try {
            const current = await db.query(
                "SELECT request_status FROM borrow_requests WHERE id = $1",
                [requestId]
            );
            if (current.rows.length === 0) {
                return res.status(404).json({ success: false, error: "Request not found" });
            }
            if (current.rows[0].request_status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    error: `Cannot reject — current status is '${current.rows[0].request_status}'`
                });
            }

            await db.query(
                "UPDATE borrow_requests SET request_status = 'rejected' WHERE id = $1",
                [requestId]
            );
            return res.json({ success: true, message: "Request rejected" });
        } catch (err) {
            console.error("Reject Error:", err.message);
            return res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
        }
    }

    // ── ACCEPTANCE: use transaction + row-level locking ──
    //
    // We obtain a dedicated client from the pool so that BEGIN/COMMIT/ROLLBACK
    // run on the SAME connection (pool.query could use different connections).
    const client = await db.connect();

    try {
        // ────────────────────────────────────────────────────
        // TRANSACTION START
        // ────────────────────────────────────────────────────
        await client.query("BEGIN");

        // Step 1: Fetch the borrow request and verify it is still pending.
        //         We also retrieve the item_id so we can lock that item next.
        const brResult = await client.query(
            "SELECT id, item_id, request_status FROM borrow_requests WHERE id = $1",
            [requestId]
        );

        if (brResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, error: "Request not found" });
        }

        const borrowRequest = brResult.rows[0];

        if (borrowRequest.request_status !== 'pending') {
            await client.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                error: `Cannot accept — current status is '${borrowRequest.request_status}'`
            });
        }

        // ──────────────────────────────────────────────────────────────────
        // Step 2: ROW-LEVEL LOCK on the item using SELECT ... FOR UPDATE
        //
        // WHY THIS PREVENTS DOUBLE-BORROWING:
        // If two lenders (or the same lender via two tabs) try to accept
        // different requests for the SAME item at the exact same time:
        //   - Transaction A reaches this query first and LOCKS the row.
        //   - Transaction B reaches the same query and BLOCKS (waits).
        //   - Transaction A sets item status to 'unavailable' and COMMITs.
        //   - Transaction B now unblocks, reads the UPDATED row,
        //     sees status = 'unavailable', and is safely rejected.
        // ──────────────────────────────────────────────────────────────────
        // Step 2: Lock the item row to prevent concurrent modifications
        const itemResult = await client.query(
            "SELECT id, status FROM items WHERE id = $1 FOR UPDATE",
            [borrowRequest.item_id]
        );

        if (itemResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ success: false, error: "Item not found" });
        }

        const item = itemResult.rows[0];

        // Step 3: Check if item is still available
        if (item.status !== 'available') {
            await client.query("ROLLBACK");
            return res.status(409).json({
                success: false,
                error: "Item is no longer available — it was already borrowed by another neighbor."
            });
        }

        // Step 4: Mark the item as unavailable
        await client.query(
            "UPDATE items SET status = 'unavailable' WHERE id = $1",
            [borrowRequest.item_id]
        );

        // Step 5: Accept this specific borrow request
        await client.query(
            "UPDATE borrow_requests SET request_status = 'accepted' WHERE id = $1",
            [requestId]
        );

        // Step 6: Auto-reject ALL other pending requests for the same item.
        //         Since the item is now taken, no other request can be fulfilled.
        const rejectedResult = await client.query(
            `UPDATE borrow_requests 
             SET request_status = 'rejected' 
             WHERE item_id = $1 
               AND id != $2 
               AND request_status = 'pending'
             RETURNING id`,
            [borrowRequest.item_id, requestId]
        );

        // ────────────────────────────────────────────────────
        // TRANSACTION END — all steps succeeded, make permanent
        // ────────────────────────────────────────────────────
        await client.query("COMMIT");

        const autoRejectedCount = rejectedResult.rows.length;

        res.json({
            success: true,
            message: "Request accepted successfully",
            details: {
                accepted_request_id: parseInt(requestId),
                item_id: borrowRequest.item_id,
                item_status: "unavailable",
                auto_rejected_requests: autoRejectedCount
            }
        });

    } catch (err) {
        // ────────────────────────────────────────────────────
        // ROLLBACK — something went wrong, undo ALL changes
        // ────────────────────────────────────────────────────
        await client.query("ROLLBACK");
        console.error("Accept Transaction Error:", err.message);
        res.status(500).json({
            success: false,
            error: "Failed to accept request. Transaction rolled back."
        });
    } finally {
        // ALWAYS release the client back to the pool,
        // even if an error occurred. Failing to do this leaks connections.
        client.release();
    }
};

// 5. Delete a listing
const deleteItem = async (req, res) => {
    const { itemId } = req.params;
    try {
        await db.query("UPDATE items SET is_active = false WHERE id = $1", [itemId]);
        res.json({ success: true, message: "Item deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

// 6. Update a listing
const updateItem = async (req, res) => {
    const { itemId } = req.params;
    const { item_name, price_per_day } = req.body;
    try {
        // Fetch existing item to check if image needs updating
        const existingItem = await db.query("SELECT * FROM items WHERE id = $1", [itemId]);
        if (existingItem.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Item not found" });
        }

        let image_url = existingItem.rows[0].image_url;
        if (req.file) {
            image_url = `/uploads/${req.file.filename}`;
        }

        const updated = await db.query(
            "UPDATE items SET item_name = $1, price_per_day = $2, image_url = $3 WHERE id = $4 RETURNING *",
            [item_name, price_per_day, image_url, itemId]
        );
        res.json({ success: true, data: updated.rows[0] });
    } catch (err) {
        console.error("Update Item Error:", err);
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

// CRITICAL: Export all functions so the Router can see them
module.exports = { 
    getMyItems, 
    listItem, 
    getLenderRequests, 
    updateRequestStatus, 
    deleteItem,
    updateItem
};