const express = require("express");
const cors = require("cors");
const pool = require("./db"); // Your PostgreSQL connection logic
const borrowRoutes = require("./routes/borrowRoutes");
const lenderRoutes = require("./routes/lenderRoutes");
const itemRoutes = require("./routes/itemRoutes");
const authRoutes = require("./routes/authRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const locationRoutes = require("./routes/locationRoutes");

const app = express();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json()); // Allows the server to accept JSON data from the frontend

// 2. ROUTES
app.use("/api", borrowRoutes);
app.use("/api/lender", lenderRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/location", locationRoutes);

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

//4.BORROWER DASHBOARD
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