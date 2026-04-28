const express = require("express");
const router = express.Router();
const { register, login } = require("../Controller/authController");

const { validate, registerSchema, loginSchema } = require("../utils/validation");

// Path: /api/auth/register
router.post("/register", validate(registerSchema), register);

// Path: /api/auth/login
router.post("/login", validate(loginSchema), login);

module.exports = router;