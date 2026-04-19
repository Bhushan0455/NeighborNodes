// Run this once to seed 3 sample users into the database
// Usage: node seed_users.js

const pool = require("./db");
const bcrypt = require("bcrypt");

const users = [
    {
        name: "Rahul Sharma",
        email: "rahul@example.com",
        phone: "9876543210",
        password: "pass123",
        role: "lender",
        locality: "Thane West",
        pincode: "400601",
        address: "B-204, Hiranandani Estate, Thane West",
        latitude: 19.1964,
        longitude: 72.9631
    },
    {
        name: "Priya Desai",
        email: "priya@example.com",
        phone: "9876543211",
        password: "pass456",
        role: "lender",
        locality: "Vashi",
        pincode: "400701",
        address: "C-12, Palm Beach Road, Vashi",
        latitude: 19.0330,
        longitude: 73.0297
    },
    {
        name: "Amit Patel",
        email: "amit@example.com",
        phone: "9876543212",
        password: "pass789",
        role: "lender",
        locality: "Andheri West",
        pincode: "400053",
        address: "A-301, Lokhandwala Complex, Andheri West",
        latitude: 19.0888,
        longitude: 72.8398
    }
];

const seedUsers = async () => {
    try {
        for (const u of users) {
            const hashedPassword = await bcrypt.hash(u.password, 10);
            await pool.query(
                `INSERT INTO users (name, email, phone, password, role, locality, pincode, full_address, latitude, longitude)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT (email) DO NOTHING`,
                [u.name, u.email, u.phone, hashedPassword, u.role, u.locality, u.pincode, u.address, u.latitude, u.longitude]
            );
            console.log(`✅ Created: ${u.name} (${u.email}) — password: ${u.password}`);
        }
        console.log("\n🎉 All 3 users seeded successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed error:", err.message);
        process.exit(1);
    }
};

seedUsers();
