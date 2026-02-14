const express = require("express");
const router = express.Router();
const { createBorrow } = require("../Controller/borrowController");

// This defines the POST endpoint: http://localhost:3000/api/borrow
router.post("/borrow", createBorrow);

module.exports = router;