const pool = require("../db");

// POST /api/contact — Submit feedback/contact message
const submitFeedback = async (req, res) => {
    try {
        const { name, email, category, subject, message, user_id } = req.body;

        // Basic validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                error: "Name, email, subject, and message are required."
            });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: "Please provide a valid email address."
            });
        }

        // Message length validation
        if (message.length > 1000) {
            return res.status(400).json({
                success: false,
                error: "Message must be 1000 characters or less."
            });
        }

        const result = await pool.query(
            `INSERT INTO feedback (user_id, name, email, category, subject, message)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, created_at`,
            [user_id || null, name, email, category || 'general', subject, message]
        );

        res.status(201).json({
            success: true,
            message: "Thank you! Your feedback has been submitted successfully.",
            feedback_id: result.rows[0].id,
            created_at: result.rows[0].created_at
        });

    } catch (err) {
        console.error("Contact Form Error:", err.message);
        res.status(500).json({
            success: false,
            error: "Something went wrong. Please try again later."
        });
    }
};

// GET /api/contact/all — Retrieve all feedback (admin use)
const getAllFeedback = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, name, email, category, subject, message, status, created_at
             FROM feedback
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (err) {
        console.error("Fetch Feedback Error:", err.message);
        res.status(500).json({ success: false, error: 'An unexpected error occurred. Please try again later.' });
    }
};

module.exports = { submitFeedback, getAllFeedback };
