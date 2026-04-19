const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db"); // Your PostgreSQL connection logic
const borrowRoutes = require("./routes/borrowRoutes");
const lenderRoutes = require("./routes/lenderRoutes");
const itemRoutes = require("./routes/itemRoutes");
const authRoutes = require("./routes/authRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const locationRoutes = require("./routes/locationRoutes");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json()); // Allows the server to accept JSON data from the frontend

// Serve frontend static files
app.use(express.static(path.join(__dirname, "..", "Frontend")));
// 2. AUTO-CANCEL UNCOLLECTED REQUESTS (Middleware)
// Automatically run before fulfilling API requests to ensure DB is clean.
// If a request is accepted but the start_date has passed (i.e. currently > start_date)
// and the borrower hasn't marked it collected, it counts as a no-show and is auto-cancelled.
app.use('/api', async (req, res, next) => {
    try {
        await pool.query(`
            WITH cancelled AS (
                UPDATE borrow_requests 
                SET request_status = 'cancelled' 
                WHERE request_status = 'accepted' AND start_date < CURRENT_DATE
                RETURNING item_id
            )
            UPDATE items 
            SET status = 'available' 
            FROM cancelled 
            WHERE items.id = cancelled.item_id
        `);
    } catch (err) {
        console.error("Auto Cancel Error:", err.message);
    }
    next();
});

// 3. ROUTES
app.use("/api", borrowRoutes);
app.use("/api/lender", lenderRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/contact", contactRoutes);

// 3. HEALTH CHECK / TEST ROUTE
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ 
      message: "NeighborNodes Backend is Live", 
      db_time: result.rows[0].now 
    });
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// 4. NOTIFICATION BADGE COUNT
// Returns total actionable requests: pending incoming (lender) + pending outgoing (borrower)
app.get('/api/notifications/count/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Count pending requests where user is the LENDER (incoming requests to act on)
        const lenderResult = await pool.query(`
            SELECT COUNT(*) AS count
            FROM borrow_requests br
            JOIN items i ON br.item_id = i.id
            WHERE i.owner_id = $1 AND br.request_status = 'pending'
        `, [userId]);

        // Count pending requests where user is the BORROWER (awaiting response)
        const borrowerResult = await pool.query(`
            SELECT COUNT(*) AS count
            FROM borrow_requests
            WHERE borrower_id = $1 AND request_status = 'pending'
        `, [userId]);

        const lenderCount = parseInt(lenderResult.rows[0].count) || 0;
        const borrowerCount = parseInt(borrowerResult.rows[0].count) || 0;
        const total = lenderCount + borrowerCount;

        res.json({
            success: true,
            total,
            incoming: lenderCount,
            outgoing: borrowerCount
        });
    } catch (err) {
        console.error("Notification Count Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. BORROWER DASHBOARD
app.get('/api/borrower/requests/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // This query joins three tables to show the borrower 
        // what item they requested and who the owner is.
        const result = await pool.query(`
            SELECT 
                br.id, 
                br.start_date, 
                br.end_date, 
                br.request_status,
                CASE 
                    WHEN br.request_status = 'collected' AND br.end_date < CURRENT_DATE 
                    THEN true ELSE false 
                END AS is_overdue,
                i.item_name, 
                u.name as owner_name 
            FROM borrow_requests br
            JOIN items i ON br.item_id = i.id
            JOIN users u ON i.owner_id = u.id
            WHERE br.borrower_id = $1
            ORDER BY br.id DESC`, [userId]);
        
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error("Borrower Dashboard Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. SERVER INITIALIZATION
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});