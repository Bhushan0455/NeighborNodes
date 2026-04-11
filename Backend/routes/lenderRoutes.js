const express = require("express");
const router = express.Router();
const { 
    listItem, 
    getLenderRequests, 
    updateRequestStatus, 
    getMyItems, 
    deleteItem,
    getItemById 
} = require("../Controller/lenderController");

// --- 1. DASHBOARD ROUTES (Specific paths first) ---

// Fetch all items listed by a specific user (OWNER)
// Path: /api/lender/my-items/:ownerId
router.get("/my-items/:ownerId", getMyItems);

// Fetch incoming borrow requests for the lender's items
// Path: /api/lender/dashboard/:userId
router.get("/dashboard/:userId", getLenderRequests);

// --- 2. ITEM MANAGEMENT ---

// Post a new item for lending
router.post("/list-item", listItem);

// Delete a specific listing
router.delete("/item/:itemId", deleteItem);

// --- 3. SINGLE ITEM VIEW (General paths last) ---

// Fetch a single item by its ID for the Borrow page
// Path: /api/lender/items/:id
router.get("/items/:id", getItemById);

// Update status of a borrow request (Accept/Reject)
router.patch("/request/:requestId", updateRequestStatus);

module.exports = router;