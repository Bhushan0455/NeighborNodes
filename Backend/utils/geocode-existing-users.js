/**
 * ONE-TIME SCRIPT: Re-geocode all existing users' coordinates
 * 
 * Run this once to update existing users who currently have
 * pincode-center coordinates with their real address coordinates.
 * 
 * Usage:  node utils/geocode-existing-users.js
 * 
 * Nominatim rate limit: 1 request/second, so this adds a delay.
 */

require("dotenv").config();
const pool = require("../db");
const { geocodeAddress } = require("./geocode");
const { getPincodeCoords } = require("./pincodeMap");

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const geocodeAllUsers = async () => {
    try {
        const result = await pool.query(
            "SELECT id, full_address, locality, pincode, latitude, longitude FROM users"
        );

        console.log(`\n📍 Found ${result.rows.length} users to geocode...\n`);

        let updated = 0;
        let failed = 0;

        for (const user of result.rows) {
            const addressParts = [user.full_address, user.locality, user.pincode]
                .filter(Boolean)
                .join(", ");

            if (!addressParts || addressParts.trim().length === 0) {
                console.log(`⏭️  User #${user.id}: No address data, skipping`);
                failed++;
                continue;
            }

            console.log(`🔍 User #${user.id}: Geocoding "${addressParts}"...`);

            const geocoded = await geocodeAddress(addressParts);

            if (geocoded) {
                await pool.query(
                    "UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3",
                    [geocoded.lat, geocoded.lng, user.id]
                );
                console.log(`   ✅ Updated → [${geocoded.lat}, ${geocoded.lng}]`);
                updated++;
            } else {
                // Keep existing coords (pincode center) as fallback
                console.log(`   ⚠️  Geocoding failed, keeping existing coords [${user.latitude}, ${user.longitude}]`);
                failed++;
            }

            // Respect Nominatim rate limit: 1 request per second
            await sleep(1100);
        }

        console.log(`\n✅ Done! Updated: ${updated}, Failed/Skipped: ${failed}\n`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Script error:", error);
        process.exit(1);
    }
};

geocodeAllUsers();
