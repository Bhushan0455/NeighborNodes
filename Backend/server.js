const express = require("express");
const cors = require("cors");
const pool = require("./db"); // Your PostgreSQL connection logic
const borrowRoutes = require("./routes/borrowRoutes");

const app = express();

// 1. MIDDLEWARE
app.use(cors());
app.use(express.json()); // Allows the server to accept JSON data from the frontend

// 2. ROUTES
// All borrowing-related endpoints will now start with /api
app.use("/api", borrowRoutes);

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

// 4. SERVER INITIALIZATION
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});