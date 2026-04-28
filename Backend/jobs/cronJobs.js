const cron = require("node-cron");
const pool = require("../db");

// Run every hour to check for overdue/uncollected reservations
// and auto-cancel them so items are freed up.
const startCronJobs = () => {
    cron.schedule("0 * * * *", async () => {
        try {
            console.log("[Node-Cron] Running cleanup for uncollected borrow requests...");
            const { rowCount } = await pool.query(`
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
            console.log(`[Node-Cron] Cleanup complete. Cancelled ${rowCount || 0} uncollected requests.`);
        } catch (err) {
            console.error("[Node-Cron] Error during uncollected requests cleanup:", err.message);
        }
    });

    console.log("Cron jobs registered successfully.");
};

module.exports = { startCronJobs };
