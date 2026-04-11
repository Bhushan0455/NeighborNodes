-- 1. USERS TABLE (Full schema with location + privacy fields)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(15) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password TEXT,
    role VARCHAR(20) CHECK (role IN ('borrower', 'lender')),
    trust_score INTEGER DEFAULT 100,
    locality VARCHAR(150),
    pincode VARCHAR(10),
    full_address TEXT,
    latitude DECIMAL(10, 6),
    longitude DECIMAL(10, 6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- If your table already exists, run these ALTER statements instead:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS locality VARCHAR(150);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS full_address TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 6);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 6);

-- 2. ITEMS TABLE
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    price_per_day DECIMAL(10, 2) NOT NULL, -- Needed for "₹500/day" display
    status VARCHAR(20) DEFAULT 'available',
    image_url TEXT, -- To store the link to your product images
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. UPDATED BORROW REQUEST TABLE
CREATE TABLE borrow_requests (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    borrower_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price DECIMAL(10, 2), -- Calculated: (end - start) * price_per_day
    request_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM users;
SELECT * FROM items;
SELECT * FROM borrow_requests;
SELECT item_name, category, owner_id FROM items;

--Dataset:
INSERT INTO items (owner_id, item_name, category, price_per_day, image_url, description) VALUES

-- UTILITY TOOLS
(1, 'Cordless Drill - Bosch', 'utility_tools', 250, 'https://images.unsplash.com/photo-1504148455328-c376907d081c', 'High power cordless drill with full drill bit set.'),
(2, 'Hammer Tool Kit', 'utility_tools', 120, 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8', 'Basic home repair hammer and tools kit.'),
(1, 'Electric Screwdriver', 'utility_tools', 150, 'https://images.unsplash.com/photo-1602526216433-1baf0da8228a', 'Rechargeable electric screwdriver set.'),
(2, 'Stud Finder', 'utility_tools', 90, 'https://images.unsplash.com/photo-1581092160562-40aa08e78837', 'Perfect tool for wall mounting shelves or TVs.'),
(1, 'Laser Level Tool', 'utility_tools', 180, 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc', 'Precision laser level for alignment tasks.'),
(2, 'Measuring Tape Set', 'utility_tools', 70, 'https://images.unsplash.com/photo-1582582494700-2f1e31b16b07', 'Durable steel measuring tape set.'),

-- HARDWARE
(1, 'Foldable Ladder 12ft', 'hardware', 220, 'https://images.unsplash.com/photo-1589939705384-5185138a04b9', 'Aluminium ladder suitable for indoor repairs.'),
(2, 'Pressure Washer', 'hardware', 600, 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e', 'High pressure washer ideal for cars and driveways.'),
(1, 'Electric Leaf Blower', 'hardware', 300, 'https://images.unsplash.com/photo-1616036740257-9449ea1f6605', 'Powerful blower for garden cleaning.'),
(2, 'Portable Generator', 'hardware', 900, 'https://images.unsplash.com/photo-1594070319944-7c0cbebb6f58', 'Compact power generator for outdoor use.'),
(1, 'Heavy Duty Workbench', 'hardware', 350, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e', 'Stable wooden workbench for garage work.'),
(2, 'Wall Mount Tool Rack', 'hardware', 100, 'https://images.unsplash.com/photo-1581093588401-16d53f1f0a07', 'Organizer rack for garage tools.'),

-- ELECTRONICS
(1, 'DJI Mavic Air 2 Drone', 'electronics', 1200, 'https://images.unsplash.com/photo-1579829366248-204fe8413f31', 'Professional drone capable of 4K video.'),
(2, 'Full HD Projector', 'electronics', 800, 'https://images.unsplash.com/photo-1517604412707-f5d89710f1e2', 'Perfect for movie nights or presentations.'),
(1, 'GoPro Hero 9', 'electronics', 700, 'https://images.unsplash.com/photo-1565479091461-7d5e1657f201', 'Action camera with waterproof housing.'),
(2, 'Bluetooth Party Speaker', 'electronics', 250, 'https://images.unsplash.com/photo-1585386959984-a41552231658', 'Loud portable speaker with bass boost.'),
(1, 'DSLR Camera - Canon', 'electronics', 1000, 'https://images.unsplash.com/photo-1519183071298-a2962eadc0d1', 'Professional DSLR camera with lens.'),
(2, 'Portable Power Bank 30000mAh', 'electronics', 120, 'https://images.unsplash.com/photo-1609592806957-32cc0c2e7d9d', 'High capacity power bank for travel.'),
(1, 'VR Headset', 'electronics', 450, 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620', 'Virtual reality headset for immersive gaming.'),

-- CAMPING
(2, 'Camping Tent (4 Person)', 'camping', 400, 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4', 'Waterproof camping tent for weekend trips.'),
(1, 'Portable Camping Stove', 'camping', 150, 'https://images.unsplash.com/photo-1508873535684-277a3cbcc4e8', 'Compact stove for outdoor cooking.'),
(2, 'Sleeping Bag Set', 'camping', 200, 'https://images.unsplash.com/photo-1526779259212-939e64788e3c', 'Warm sleeping bags suitable for trekking.'),
(1, 'Camping Lantern', 'camping', 90, 'https://images.unsplash.com/photo-1504470695779-75300268aa5e', 'Rechargeable lantern for night camping.'),
(2, 'Inflatable Kayak', 'camping', 700, 'https://images.unsplash.com/photo-1559136555-9303baea8ebd', 'Two-person inflatable kayak with paddles.'),
(1, 'Picnic Basket Set', 'camping', 120, 'https://images.unsplash.com/photo-1591189863430-ab87e120f312', 'Basket with plates and cutlery for outdoor picnic.'),

-- GAMING
(2, 'PlayStation 5 Console', 'gaming', 900, 'https://images.unsplash.com/photo-1606813909355-1c8d1d80b3e6', 'PS5 with two controllers.'),
(1, 'Nintendo Switch', 'gaming', 400, 'https://images.unsplash.com/photo-1578303321116-b84aad51982d', 'Portable gaming console with Mario Kart.'),
(2, 'Gaming Steering Wheel', 'gaming', 250, 'https://images.unsplash.com/photo-1587202372775-9895a5e7e76f', 'Racing wheel for simulation games.'),
(1, 'VR Gaming Controller Set', 'gaming', 200, 'https://images.unsplash.com/photo-1606813902914-efbc90a1a26c', 'Controllers compatible with VR systems.'),
(2, 'Gaming Projector Screen', 'gaming', 150, 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70', 'Large projector screen for gaming sessions.'),

-- HOME APPLIANCES
(1, 'Air Fryer 4L', 'home_appliances', 250, 'https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1', 'Healthy cooking air fryer with timer.'),
(2, 'Robot Vacuum Cleaner', 'home_appliances', 500, 'https://images.unsplash.com/photo-1581578731548-c64695cc6952', 'Automatic smart vacuum cleaner.'),
(1, 'Clothes Steamer', 'home_appliances', 180, 'https://images.unsplash.com/photo-1567016526105-b6c1b3d0d5a6', 'Portable steamer for wrinkle-free clothes.'),
(2, 'Portable Air Cooler', 'home_appliances', 300, 'https://images.unsplash.com/photo-1597082299723-26d84c0c6d3c', 'Energy efficient room cooler.'),
(1, 'Electric Heater', 'home_appliances', 220, 'https://images.unsplash.com/photo-1598300053655-0f66fda8db58', 'Compact heater for winter use.'),

-- KITCHEN
(2, 'Stand Mixer', 'kitchen', 350, 'https://images.unsplash.com/photo-1576820582270-d3e5c27a2d8d', 'Perfect for baking and dough mixing.'),
(1, 'Coffee Grinder', 'kitchen', 150, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e', 'Burr grinder for fresh coffee beans.'),
(2, 'Slow Cooker', 'kitchen', 200, 'https://images.unsplash.com/photo-1547230112-6de028448130', '8-quart slow cooker for stews.'),
(1, 'Blender Set', 'kitchen', 180, 'https://images.unsplash.com/photo-1579618213749-2b8c4e6d3c41', 'Multi-purpose kitchen blender.'),
(2, 'Popcorn Maker', 'kitchen', 120, 'https://images.unsplash.com/photo-1585647347384-2593bc35786b', 'Hot air popcorn maker for movie nights.');

--To reset the database 
TRUNCATE TABLE items RESTART IDENTITY CASCADE;



