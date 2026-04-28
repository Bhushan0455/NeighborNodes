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

const { validate, listItemSchema } = require("../utils/validation");
const upload = require("../utils/uploadMiddleware");

// Post a new item for lending
// upload.single('image') handles multipart/form-data with a file field named 'image'
router.post("/list-item", upload.single('image'), listItem);

// Update a specific listing
router.patch("/item/:itemId", upload.single('image'), require("../Controller/lenderController").updateItem);

// Delete a specific listing
router.delete("/item/:itemId", deleteItem);

// Update status of a borrow request (Accept/Reject)
router.patch("/request/:requestId", updateRequestStatus);

module.exports = router;