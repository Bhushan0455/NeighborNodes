const express = require("express");
const router = express.Router();
const { createBorrow, getPickupAddress, markCollected, markReturned } = require("../Controller/borrowController");

const { validate, borrowRequestSchema } = require("../utils/validation");

// This defines the POST endpoint: http://localhost:5000/api/borrow
router.post("/borrow", validate(borrowRequestSchema), createBorrow);

// Address reveal — only after request is accepted or collected
// GET /api/borrow/address/:requestId/:userId
router.get("/borrow/address/:requestId/:userId", getPickupAddress);

// Borrower lifecycle actions
// PATCH /api/borrow/:requestId/collect — mark accepted → collected
router.patch("/borrow/:requestId/collect", markCollected);

// PATCH /api/borrow/:requestId/return — mark collected → returned
router.patch("/borrow/:requestId/return", markReturned);

module.exports = router;