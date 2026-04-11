-- ================================
-- BORROW LIFECYCLE STATUS MIGRATION
-- ================================
-- Run this SQL in your PostgreSQL database to enable lifecycle statuses.
-- This updates the CHECK constraint on `request_status` to allow:
--   pending, accepted, rejected, collected, returned
-- Note: 'overdue' is computed dynamically (not stored in DB).

-- Step 1: Drop old constraint (if it exists)
ALTER TABLE borrow_requests DROP CONSTRAINT IF EXISTS borrow_requests_request_status_check;

-- Step 2: Add new constraint with lifecycle statuses
ALTER TABLE borrow_requests ADD CONSTRAINT borrow_requests_request_status_check 
  CHECK (request_status IN ('pending', 'accepted', 'rejected', 'collected', 'returned'));

-- Verify: Check current statuses in the table
SELECT request_status, COUNT(*) FROM borrow_requests GROUP BY request_status;
