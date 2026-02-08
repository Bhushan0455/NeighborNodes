// ===============================
// NeighborNodes Frontend Script
// Connects Frontend → Node.js Backend
// ===============================

// 🔗 Change this when you deploy backend online
const API_BASE_URL = "http://localhost:5000/api";


// -------------------------------
// BORROW BUTTON HANDLER
// -------------------------------
async function borrowItem(itemName) {
  try {

    // ⚠️ For now using demo user values
    // Later you will take from login form
    const borrowData = {
      item_name: itemName,
      borrower_name: "Demo User",
      address: "Mumbai"
    };

    const response = await fetch(`${API_BASE_URL}/borrow`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(borrowData)
    });

    const result = await response.json();

    alert("✅ Borrow request sent successfully!");
    console.log("Server Response:", result);

  } catch (error) {
    console.error("Borrow Error:", error);
    alert("❌ Failed to send request. Is backend running?");
  }
}


// -------------------------------
// AUTO ATTACH EVENTS TO BUTTONS
// -------------------------------

// When page loads, attach click events
document.addEventListener("DOMContentLoaded", () => {

  // Find ALL borrow buttons
  const borrowButtons = document.querySelectorAll(".borrow-btn");

  borrowButtons.forEach((btn) => {

    btn.addEventListener("click", (e) => {
      e.preventDefault();

      // Get item name from card title
      const card = btn.closest(".item-card");
      const itemName = card.querySelector("h3").innerText;

      borrowItem(itemName);
    });

  });

});
