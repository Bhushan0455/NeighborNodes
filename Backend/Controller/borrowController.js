const pool = require("../db"); // Import your database connection

const createBorrow = async (req, res) => {
    try {
        // Destructure data coming from your Borrow.html form
        const { item_id, borrower_id, start_date, end_date } = req.body;

        // SQL Query to insert the borrow request into your PostgreSQL table
        const request = await pool.query(
            "INSERT INTO borrow_requests (item_id, borrower_id, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *",
            [item_id, borrower_id, start_date, end_date]
        );

        // Send back the newly created request as a JSON response
        res.status(201).json({
            success: true,
            data: request.rows[0]
        });
    } catch (err) {
        console.error("BORROW ERROR:", err.message);
        res.status(500).json({ 
            success: false, 
            error: "Internal Server Error" 
        });
    }
};

module.exports = { createBorrow };