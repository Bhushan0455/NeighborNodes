-- ============================================================
-- FIX: Update all users' latitude/longitude to correct values
-- based on their pincode (from pincodeMap.js)
-- 
-- The geocoding API returned WRONG coordinates for most users.
-- This script sets them to the correct pincode center coords.
--
-- Run this ONCE in your PostgreSQL client (pgAdmin / psql).
-- ============================================================

-- Thane West (400601) → correct: 19.1964, 72.9631
UPDATE users SET latitude = 19.1964, longitude = 72.9631
WHERE pincode = '400601';

-- Thane East (400602)
UPDATE users SET latitude = 19.1860, longitude = 72.9750
WHERE pincode = '400602';

-- Thane Naupada (400603)
UPDATE users SET latitude = 19.2183, longitude = 72.9781
WHERE pincode = '400603';

-- Thane Wagle Estate (400604)
UPDATE users SET latitude = 19.2403, longitude = 72.9710
WHERE pincode = '400604';

-- Thane Kolshet (400605)
UPDATE users SET latitude = 19.2094, longitude = 72.9870
WHERE pincode = '400605';

-- Thane Pokharan (400606)
UPDATE users SET latitude = 19.2285, longitude = 72.9645
WHERE pincode = '400606';

-- Thane Manpada (400607)
UPDATE users SET latitude = 19.2520, longitude = 72.9680
WHERE pincode = '400607';

-- Thane Ghodbunder Road (400610)
UPDATE users SET latitude = 19.2590, longitude = 72.9590
WHERE pincode = '400610';

-- Nerul (400703)
UPDATE users SET latitude = 19.0178, longitude = 73.0390
WHERE pincode = '400703';

-- Airoli / Nerul area (400706)
UPDATE users SET latitude = 19.0625, longitude = 73.0020
WHERE pincode = '400706';

-- Panvel (410206)
UPDATE users SET latitude = 18.9388, longitude = 73.0865
WHERE pincode = '410206';

-- Dadar (400014)
UPDATE users SET latitude = 19.0176, longitude = 72.8562
WHERE pincode = '400014';

-- Andheri West (400053)
UPDATE users SET latitude = 19.0888, longitude = 72.8398
WHERE pincode = '400053';

-- Vashi (400701)
UPDATE users SET latitude = 19.0330, longitude = 73.0297
WHERE pincode = '400701';

-- Kopar Khairane (400705)
UPDATE users SET latitude = 19.0470, longitude = 73.0180
WHERE pincode = '400705';

-- Panvel (400709)
UPDATE users SET latitude = 18.9950, longitude = 73.0430
WHERE pincode = '400709';

-- Kharghar (400710)
UPDATE users SET latitude = 18.9700, longitude = 73.1100
WHERE pincode = '400710';

-- Bandra West (400049)
UPDATE users SET latitude = 19.0596, longitude = 72.8295
WHERE pincode = '400049';

-- Andheri East (400055)
UPDATE users SET latitude = 19.0800, longitude = 72.8650
WHERE pincode = '400055';

-- Powai (400076)
UPDATE users SET latitude = 19.0660, longitude = 72.9080
WHERE pincode = '400076';

-- Borivali West (400104)
UPDATE users SET latitude = 19.1830, longitude = 72.8480
WHERE pincode = '400104';

-- ============================================================
-- VERIFY: Check that all users now have correct coordinates
-- ============================================================
SELECT id, name, locality, pincode, latitude, longitude 
FROM users 
ORDER BY pincode, id;
