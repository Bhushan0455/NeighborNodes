const API_BASE_URL = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", () => {
    // 1. Identify active elements
    const homeBorrowBtns = document.querySelectorAll(".borrow-btn");
    const reserveBtn = document.getElementById("reserveBtn");

    // --- HOME PAGE LOGIC (index.html) ---
    if (homeBorrowBtns.length > 0) {
        homeBorrowBtns.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const itemId = btn.getAttribute("data-item-id");
                // Redirect to borrow.html with item ID as a parameter
                window.location.href = `borrow.html?id=${itemId}`;
            });
        });
    }

    // --- BORROW PAGE LOGIC (borrow.html) ---
    if (reserveBtn) {
        reserveBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            // Extract data from URL and Inputs
            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id') || 1; // Fallback to 1 for testing
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;

            // Prepare payload for PostgreSQL
            const borrowData = {
                item_id: parseInt(itemId),
                borrower_id: 1, // Mock user ID (Update this after login is built)
                start_date: startDate,
                end_date: endDate
            };

            // Basic Validation
            if (!startDate || !endDate) {
                alert("Please select both start and end dates.");
                return;
            }

            try {
                // Send to Node.js Backend
                const response = await fetch(`${API_BASE_URL}/borrow`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(borrowData)
                });

                const result = await response.json();

                if (result.success) {
                    alert("✅ Borrow request recorded in PostgreSQL!");
                    reserveBtn.innerText = "Requested";
                    reserveBtn.style.background = "#10b981";
                    reserveBtn.disabled = true;
                } else {
                    alert("❌ Error: " + result.error);
                }
            } catch (error) {
                console.error("Backend Error:", error);
                alert("❌ Server is not responding. Check your Node.js console.");
            }
        });
    }
});