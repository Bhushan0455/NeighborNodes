-- 1. USERS TABLE
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    phone VARCHAR(15) UNIQUE NOT NULL, -- Essential for your Login/OTP flow
    email VARCHAR(150) UNIQUE,
    role VARCHAR(20) CHECK (role IN ('borrower', 'lender')), -- Supports dual-role login
    trust_score INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- 1. Create a User (Lender)
INSERT INTO users (id, name, phone, email, role) 
VALUES (1, 'Amit Sharma', '9876543210', 'amit@example.com', 'lender');

-- 2. Create an Item (The Canon R6)
INSERT INTO items (id, owner_id, item_name, description, category, price_per_day) 
VALUES (1, 1, 'Canon EOS R6', 'Professional mirrorless camera', 'Electronics', 500);

-- This helps the lender see requests meant for them specifically
ALTER TABLE borrow_requests ADD COLUMN IF NOT EXISTS lender_id INTEGER REFERENCES users(id);