const express = require("express");
const router = express.Router();
const { submitFeedback, getAllFeedback } = require("../Controller/contactController");

// POST /api/contact — Submit a feedback/contact message
router.post("/", submitFeedback);

// GET /api/contact/all — Get all feedback entries (admin)
router.get("/all", getAllFeedback);

module.exports = router;
