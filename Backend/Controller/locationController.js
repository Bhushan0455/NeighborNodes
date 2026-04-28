const pool = require("../db");
const { calculateDistanceKm } = require("../utils/haversine");
const { getPincodeCoords } = require("../utils/pincodeMap");

const getNearbyItems = async (req, res) => {
    try {
        const currentUserId = parseInt(req.params.userId);

        // 1. Get current user's pincode and locality
        const userResult = await pool.query(
            "SELECT id, locality, pincode, latitude, longitude FROM users WHERE id = $1",
            [currentUserId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        const currentUser = userResult.rows[0];

        if (!currentUser.pincode) {
            return res.status(400).json({
                success: false,
                error: "Current user pincode is missing. Please update your profile."
            });
        }

        // 2. Get the CORRECT center coordinates for the user's pincode
        //    This is the reliable source — not the stored lat/lng which may be wrong
        const pincodeCenter = getPincodeCoords(currentUser.pincode);
        if (!pincodeCenter) {
            return res.status(400).json({
                success: false,
                error: "Pincode not supported. Please contact support."
            });
        }

        const userLat = pincodeCenter.lat;
        const userLng = pincodeCenter.lng;

        // 3. Get available items ONLY from owners in the SAME PINCODE (community circle)
        const itemsResult = await pool.query(`
            SELECT 
                items.id,
                items.owner_id,
                items.item_name,
                items.description,
                items.category,
                items.price_per_day,
                items.status,
                items.image_url,
                users.name AS owner_name,
                users.locality,
                users.pincode
            FROM items
            JOIN users ON items.owner_id = users.id
            WHERE LOWER(items.status) = 'available'
              AND items.owner_id != $1
              AND users.pincode = $2
              AND items.is_active = true
            ORDER BY items.id DESC
        `, [currentUserId, currentUser.pincode]);

        // 4. Place each item at a natural-looking scattered position within the pincode area.
        //    Uses item.id as a seed so positions are random-looking but stable across reloads.
        const seededRandom = (seed) => {
            // Simple deterministic hash: returns a value between 0 and 1
            const x = Math.sin(seed * 9301 + 49297) * 49297;
            return x - Math.floor(x);
        };

        const itemsWithCoords = itemsResult.rows.map((item) => {
            const itemPincodeCenter = getPincodeCoords(item.pincode) || pincodeCenter;

            // Scatter randomly within ~400m using item.id as seed
            const r1 = seededRandom(item.id);       // 0 to 1
            const r2 = seededRandom(item.id * 7 + 3); // different 0 to 1
            const latOffset = (r1 - 0.5) * 0.007;   // ~-350m to +350m
            const lngOffset = (r2 - 0.5) * 0.007;
            const itemLat = itemPincodeCenter.lat + latOffset;
            const itemLng = itemPincodeCenter.lng + lngOffset;

            // Distance from user center to item (within the same locality, will be small)
            const distance = calculateDistanceKm(userLat, userLng, itemLat, itemLng);

            return {
                id: item.id,
                owner_id: item.owner_id,
                item_name: item.item_name,
                description: item.description,
                category: item.category,
                price_per_day: item.price_per_day,
                status: item.status,
                image_url: item.image_url,
                owner_name: item.owner_name,
                locality: item.locality,
                pincode: item.pincode,
                latitude: Number(itemLat.toFixed(6)),
                longitude: Number(itemLng.toFixed(6)),
                distance_km: Number(distance.toFixed(1))
            };
        });

        // Sort by distance (nearest first)
        itemsWithCoords.sort((a, b) => a.distance_km - b.distance_km);

        res.json({
            success: true,
            user_latitude: userLat,
            user_longitude: userLng,
            user_locality: currentUser.locality || pincodeCenter.area,
            user_pincode: currentUser.pincode,
            data: itemsWithCoords
        });

    } catch (error) {
        console.error("Nearby Items Error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch nearby items"
        });
    }
};

module.exports = { getNearbyItems };