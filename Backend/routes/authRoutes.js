const express = require("express");
const router = express.Router();
const { register, login } = require("../Controller/authController");

// Path: /api/auth/register
router.post("/register", register);

// Path: /api/auth/login
router.post("/login", login);

module.exports = router;