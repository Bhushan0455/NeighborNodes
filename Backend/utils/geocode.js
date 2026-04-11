// ===== ADDRESS GEOCODING USING OPENSTREETMAP NOMINATIM =====
// Converts a full address string into precise latitude/longitude.
// Free, no API key needed. Rate limit: 1 request/sec (Nominatim policy).

const https = require("https");

/**
 * Geocode an address string into { lat, lng } using OpenStreetMap Nominatim.
 * @param {string} fullAddress - e.g. "Flat 301, Sky Tower, Thane West, 400601"
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
const geocodeAddress = (fullAddress) => {
    return new Promise((resolve) => {
        if (!fullAddress || fullAddress.trim().length === 0) {
            return resolve(null);
        }

        const query = encodeURIComponent(fullAddress.trim());
        const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=in`;

        const options = {
            headers: {
                "User-Agent": "NeighborNodes/1.0 (community-sharing-app)"
            }
        };

        https.get(url, options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    const results = JSON.parse(data);
                    if (results && results.length > 0) {
                        resolve({
                            lat: parseFloat(results[0].lat),
                            lng: parseFloat(results[0].lon)
                        });
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error("Geocode parse error:", e.message);
                    resolve(null);
                }
            });
        }).on("error", (err) => {
            console.error("Geocode request error:", err.message);
            resolve(null);
        });
    });
};

module.exports = { geocodeAddress };
