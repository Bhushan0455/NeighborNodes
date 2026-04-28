-- 1. Index on users(pincode) to speed up community/nearby searches
CREATE INDEX IF NOT EXISTS idx_users_pincode ON users(pincode);

-- Note: The items table doesn't have a pincode column (it's accessed via the owner's users.pincode), 
-- but we create an index on items(status) to quickly find 'available' items.
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);

-- 2. Indexes on borrow_requests to speed up dashboard queries and overlapping checks
CREATE INDEX IF NOT EXISTS idx_borrow_requests_item_id ON borrow_requests(item_id);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON borrow_requests(request_status);

SELECT * FROM items;